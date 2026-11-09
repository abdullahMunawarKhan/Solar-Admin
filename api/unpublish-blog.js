import { getSupabaseAdmin, authenticateAdminRequest } from './lib/supabase-server.js';
import { generateBlogsListingHtml, removeUrlFromSitemap } from './lib/html-generator.js';
import { getRepoFile, commitFilesToRepo } from './lib/github.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let blogId = null;
  let supabase = null;

  try {
    await authenticateAdminRequest(req.headers.authorization);

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    blogId = body?.blogId;

    if (!blogId) {
      return res.status(400).json({ error: 'Missing blogId in request body.' });
    }

    supabase = getSupabaseAdmin();

    const { data: blog, error: fetchError } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (fetchError || !blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    const siteOrigin = process.env.SITE_ORIGIN || 'https://www.example.com';
    const blogDir = (process.env.BLOG_OUTPUT_DIRECTORY || 'blog').replace(/^\/|\/$/g, '');
    const listingPath = process.env.BLOGS_LISTING_PATH || 'blogs.html';
    const sitemapPath = process.env.SITEMAP_PATH || 'sitemap.xml';
    const canonicalUrl = blog.canonical_url || `${siteOrigin.replace(/\/$/, '')}/${blogDir}/${blog.slug}.html`;

    // 1. Fetch remaining published blogs
    const { data: remainingPublished } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, featured_image, image_alt, author_name, category, published_at')
      .eq('status', 'published')
      .neq('id', blogId)
      .order('published_at', { ascending: false });

    // 2. Update blogs.html
    const existingListing = await getRepoFile(listingPath).catch(() => null);
    const updatedListingHtml = generateBlogsListingHtml(
      remainingPublished || [],
      existingListing ? existingListing.content : null,
      { siteOrigin, blogDirectory: blogDir }
    );

    // 3. Remove URL from sitemap.xml
    const existingSitemap = await getRepoFile(sitemapPath).catch(() => null);
    const updatedSitemapXml = removeUrlFromSitemap(
      existingSitemap ? existingSitemap.content : '',
      canonicalUrl
    );

    // 4. Overwrite article file with a clean 410 Gone / Redirect placeholder or removal
    const articleFilePath = `${blogDir}/${blog.slug}.html`;
    const goneHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Article No Longer Available</title>
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

    let commitResult;
    try {
      commitResult = await commitFilesToRepo(
        filesToCommit,
        `Unpublish blog: "${blog.title}" (${blog.slug})`
      );
    } catch (githubErr) {
      if (!process.env.GITHUB_TOKEN) {
        commitResult = { commitSha: 'simulated-unpublish', commitUrl: '#' };
      } else {
        throw githubErr;
      }
    }

    // 5. Update blog record to draft/archived
    await supabase
      .from('blogs')
      .update({
        status: 'draft',
        published_commit_sha: null,
      })
      .eq('id', blogId);

    return res.status(200).json({
      success: true,
      message: 'Blog unpublished and removed from public directory.',
      commitSha: commitResult.commitSha,
    });
  } catch (error) {
    console.error('Unpublishing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while unpublishing blog.',
    });
  }
}
