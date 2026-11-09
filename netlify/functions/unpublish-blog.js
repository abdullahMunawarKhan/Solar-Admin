import { getSupabaseAdmin, authenticateAdminRequest } from '../../api/lib/supabase-server.js';
import { generateBlogsListingHtml, removeUrlFromSitemap } from '../../api/lib/html-generator.js';
import { getRepoFile, commitFilesToRepo, getGitHubConfig } from '../../api/lib/github.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const config = {
  path: '/api/unpublish-blog',
};

export default async function handler(req, context) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: JSON_HEADERS }
    );
  }

  let blogId = null;
  let supabase = null;

  try {
    // 1. Authenticate user as an authorized admin strictly via public.admin_users
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    await authenticateAdminRequest(authHeader);

    // 2. Validate GitHub configuration upfront before mutating database state
    const { token, owner, repo } = getGitHubConfig();
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unpublishing rejected: GITHUB_TOKEN server environment variable is not configured. Real GitHub credentials are required.',
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unpublishing rejected: GITHUB_OWNER or GITHUB_MAIN_WEBSITE_REPO is not configured.',
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json().catch(() => ({}));
    blogId = body?.blogId;

    if (!blogId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing blogId in request body.' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    supabase = getSupabaseAdmin();

    // 4. Fetch blog record
    const { data: blog, error: fetchError } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (fetchError || !blog) {
      return new Response(
        JSON.stringify({ success: false, error: 'Blog not found.' }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    const siteOrigin = (process.env.SITE_ORIGIN || 'https://www.proudindiansolar.com').replace(/\/$/, '');
    const blogDir = (process.env.BLOG_OUTPUT_DIRECTORY || 'blog').replace(/^\/|\/$/g, '');
    const listingPath = process.env.BLOGS_LISTING_PATH || 'blogs.html';
    const sitemapPath = process.env.SITEMAP_PATH || 'sitemap.xml';
    const canonicalUrl = blog.canonical_url || `${siteOrigin}/${blogDir}/${blog.slug}.html`;

    // 5. Fetch remaining published blogs to rebuild listing
    const { data: remainingPublished } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, featured_image, image_alt, author_name, category, published_at')
      .eq('status', 'published')
      .neq('id', blogId)
      .order('published_at', { ascending: false });

    // 6. Update blogs.html
    const existingListing = await getRepoFile(listingPath).catch(() => null);
    const updatedListingHtml = generateBlogsListingHtml(
      remainingPublished || [],
      existingListing ? existingListing.content : null,
      { siteOrigin, blogDirectory: blogDir }
    );

    // 7. Remove URL from sitemap.xml
    const existingSitemap = await getRepoFile(sitemapPath).catch(() => null);
    const updatedSitemapXml = removeUrlFromSitemap(
      existingSitemap ? existingSitemap.content : '',
      canonicalUrl
    );

    // 8. Overwrite article file with a clean 410 Gone / redirect placeholder
    const articleFilePath = `${blogDir}/${blog.slug}.html`;
    const goneHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Article No Longer Available | Proud Indian Solar</title>
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="3; url=/blogs.html">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 5rem 1rem;">
  <h1>Article Removed</h1>
  <p>This article has been unpublished or moved.</p>
  <p>Redirecting to <a href="/blogs.html">blog directory</a>...</p>
</body>
</html>`;

    const filesToCommit = [
      { path: articleFilePath, content: goneHtml },
      { path: listingPath, content: updatedListingHtml },
      { path: sitemapPath, content: updatedSitemapXml },
    ];

    // 9. Commit changes to GitHub repository (Strictly real execution, no simulation)
    let commitResult;
    try {
      commitResult = await commitFilesToRepo(
        filesToCommit,
        `Unpublish blog: "${blog.title}" (${blog.slug})`
      );
    } catch (githubErr) {
      console.error('GitHub unpublish commit error:', githubErr);
      // DO NOT update the blog status to draft if GitHub unpublishing fails
      await supabase
        .from('blogs')
        .update({
          last_publish_error: `GitHub unpublish commit failed: ${githubErr.message}`,
        })
        .eq('id', blogId)
        .catch(() => {});

      return new Response(
        JSON.stringify({
          success: false,
          error: `Unpublishing failed at GitHub commit stage: ${githubErr.message}`,
        }),
        { status: 502, headers: JSON_HEADERS }
      );
    }

    // 10. Update blog record to draft/unpublished state ONLY after successful commit
    const { error: updateError } = await supabase
      .from('blogs')
      .update({
        status: 'draft',
        published_commit_sha: null,
        last_publish_error: null,
      })
      .eq('id', blogId);

    if (updateError) {
      console.error('Error updating unpublished status in Supabase:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `GitHub commit succeeded (${commitResult.commitSha}) but failed to update status in Supabase: ${updateError.message}`,
          commitSha: commitResult.commitSha,
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Blog successfully unpublished and removed from public website directory.',
        commitSha: commitResult.commitSha,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error) {
    console.error('Unpublishing error:', error);
    const statusCode = error.status || 500;
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error while unpublishing blog.',
      }),
      { status: statusCode, headers: JSON_HEADERS }
    );
  }
}
