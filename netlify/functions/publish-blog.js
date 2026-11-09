import { getSupabaseAdmin, authenticateAdminRequest } from '../../api/lib/supabase-server.js';
import { generateArticleHtml, generateBlogsListingHtml, updateSitemapXml } from '../../api/lib/html-generator.js';
import { getRepoFile, commitFilesToRepo, getGitHubConfig } from '../../api/lib/github.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const config = {
  path: '/api/publish-blog',
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
  let previousStatus = 'draft';

  try {
    // 1. Authenticate user as an authorized admin strictly via public.admin_users
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    await authenticateAdminRequest(authHeader);

    // 2. Validate GitHub configuration upfront before mutating database state
    const { token, owner, repo, branch } = getGitHubConfig();
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Publishing rejected: GITHUB_TOKEN server environment variable is not configured. Real GitHub credentials are required.',
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Publishing rejected: GITHUB_OWNER or GITHUB_MAIN_WEBSITE_REPO is not configured.',
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
        JSON.stringify({ success: false, error: `Blog not found: ${fetchError?.message || 'Unknown error'}` }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    previousStatus = blog.status;

    // 5. Validate required fields
    if (!blog.title || !blog.title.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot publish: Blog title is required.' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    if (!blog.slug || !blog.slug.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot publish: Blog URL slug is required.' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    if (!blog.content_html && (!blog.content || typeof blog.content !== 'object')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot publish: Blog content is empty.' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // 6. Lock status to 'publishing' to prevent concurrent publishing
    await supabase
      .from('blogs')
      .update({
        status: 'publishing',
        last_publish_error: null,
      })
      .eq('id', blogId);

    const siteOrigin = (process.env.SITE_ORIGIN || 'https://www.proudindiansolar.com').replace(/\/$/, '');
    const blogDir = (process.env.BLOG_OUTPUT_DIRECTORY || 'blog').replace(/^\/|\/$/g, '');
    const listingPath = process.env.BLOGS_LISTING_PATH || 'blogs.html';
    const sitemapPath = process.env.SITEMAP_PATH || 'sitemap.xml';

    // 7. Generate static article HTML
    const publishedAt = blog.published_at || new Date().toISOString();
    const blogForGeneration = {
      ...blog,
      published_at: publishedAt,
    };
    const articleHtml = generateArticleHtml(blogForGeneration, {
      siteOrigin,
      blogDirectory: blogDir,
    });

    // 8. Fetch currently published blogs to rebuild listing
    const { data: allPublished } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, featured_image, image_alt, author_name, category, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const combinedPublished = [
      blogForGeneration,
      ...(allPublished || []).filter((b) => b.id !== blogId),
    ].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    // 9. Retrieve existing blogs.html from repo if available
    const existingListing = await getRepoFile(listingPath).catch(() => null);
    const updatedListingHtml = generateBlogsListingHtml(
      combinedPublished,
      existingListing ? existingListing.content : null,
      { siteOrigin, blogDirectory: blogDir }
    );

    // 10. Retrieve and update sitemap.xml
    const existingSitemap = await getRepoFile(sitemapPath).catch(() => null);
    const canonicalUrl = blog.canonical_url || `${siteOrigin}/${blogDir}/${blog.slug}.html`;
    const updatedSitemapXml = updateSitemapXml(
      existingSitemap ? existingSitemap.content : null,
      canonicalUrl,
      publishedAt
    );

    // 11. Prepare atomic commit payload
    const articleFilePath = `${blogDir}/${blog.slug}.html`;
    const filesToCommit = [
      { path: articleFilePath, content: articleHtml },
      { path: listingPath, content: updatedListingHtml },
      { path: sitemapPath, content: updatedSitemapXml },
    ];

    // 12. Commit files to GitHub repository (Strictly real execution, no simulation)
    let commitResult;
    try {
      commitResult = await commitFilesToRepo(
        filesToCommit,
        `Publish blog: "${blog.title}" (${blog.slug})`
      );
    } catch (githubErr) {
      console.error('GitHub commit failed during publishing:', githubErr);
      // Revert status in database so post is not left stuck in 'publishing' or falsely marked 'published'
      await supabase
        .from('blogs')
        .update({
          status: previousStatus === 'published' ? 'published' : 'draft',
          last_publish_error: `GitHub commit failed: ${githubErr.message}`,
        })
        .eq('id', blogId)
        .catch(() => {});

      return new Response(
        JSON.stringify({
          success: false,
          error: `Publishing failed at GitHub commit stage: ${githubErr.message}`,
        }),
        { status: 502, headers: JSON_HEADERS }
      );
    }

    // 13. Update database record ONLY after successful GitHub commit
    const { error: updateError } = await supabase
      .from('blogs')
      .update({
        status: 'published',
        published_at: publishedAt,
        published_commit_sha: commitResult.commitSha,
        last_publish_error: null,
      })
      .eq('id', blogId);

    if (updateError) {
      console.error('Error updating published status in Supabase:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Files committed to GitHub (${commitResult.commitSha}) but database status update failed: ${updateError.message}`,
          commitSha: commitResult.commitSha,
          commitUrl: commitResult.commitUrl,
          publicUrl: canonicalUrl,
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Blog successfully published and committed to main website repository.',
        commitSha: commitResult.commitSha,
        commitUrl: commitResult.commitUrl,
        publicUrl: canonicalUrl,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error) {
    console.error('Publishing error:', error);

    // Rollback status if an error occurred during preparation
    if (blogId && supabase) {
      await supabase
        .from('blogs')
        .update({
          status: previousStatus === 'published' ? 'published' : 'draft',
          last_publish_error: error.message || 'Unknown publishing failure',
        })
        .eq('id', blogId)
        .catch(() => {});
    }

    const statusCode = error.status || 500;
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error while publishing blog.',
      }),
      { status: statusCode, headers: JSON_HEADERS }
    );
  }
}
