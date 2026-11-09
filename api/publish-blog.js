import { getSupabaseAdmin, authenticateAdminRequest } from './lib/supabase-server.js';
import { generateArticleHtml, generateBlogsListingHtml, updateSitemapXml } from './lib/html-generator.js';
import { getRepoFile, commitFilesToRepo } from './lib/github.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(455 || 405).json({ error: 'Method not allowed. Use POST.' });
  }

  let blogId = null;
  let supabase = null;

  try {
    // 1. Authenticate user as an authorized admin
    await authenticateAdminRequest(req.headers.authorization);

    // 2. Parse request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    blogId = body?.blogId;

    if (!blogId) {
      return res.status(400).json({ error: 'Missing blogId in request body.' });
    }

    supabase = getSupabaseAdmin();

    // 3. Fetch blog record
    const { data: blog, error: fetchError } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (fetchError || !blog) {
      return res.status(404).json({ error: `Blog not found: ${fetchError?.message || 'Unknown error'}` });
    }

    // 4. Validate required fields
    if (!blog.title || !blog.title.trim()) {
      return res.status(400).json({ error: 'Cannot publish: Blog title is required.' });
    }
    if (!blog.slug || !blog.slug.trim()) {
      return res.status(400).json({ error: 'Cannot publish: Blog URL slug is required.' });
    }
    if (!blog.content_html && (!blog.content || typeof blog.content !== 'object')) {
      return res.status(400).json({ error: 'Cannot publish: Blog content is empty.' });
    }

    // 5. Update status to 'publishing' to prevent concurrent publishing
    await supabase
      .from('blogs')
      .update({
        status: 'publishing',
        last_publish_error: null,
      })
      .eq('id', blogId);

    const siteOrigin = process.env.SITE_ORIGIN || 'https://www.example.com';
    const blogDir = (process.env.BLOG_OUTPUT_DIRECTORY || 'blog').replace(/^\/|\/$/g, '');
    const listingPath = process.env.BLOGS_LISTING_PATH || 'blogs.html';
    const sitemapPath = process.env.SITEMAP_PATH || 'sitemap.xml';

    // 6. Generate the static article HTML
    const publishedAt = blog.published_at || new Date().toISOString();
    const blogForGeneration = {
      ...blog,
      published_at: publishedAt,
    };
    const articleHtml = generateArticleHtml(blogForGeneration, {
      siteOrigin,
      blogDirectory: blogDir,
    });

    // 7. Fetch all currently published blogs to rebuild listing
    const { data: allPublished } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, featured_image, image_alt, author_name, category, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Include current blog in published list
    const combinedPublished = [
      blogForGeneration,
      ...(allPublished || []).filter((b) => b.id !== blogId),
    ].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    // 8. Retrieve existing blogs.html from repo if available
    const existingListing = await getRepoFile(listingPath).catch(() => null);
    const updatedListingHtml = generateBlogsListingHtml(
      combinedPublished,
      existingListing ? existingListing.content : null,
      { siteOrigin, blogDirectory: blogDir }
    );

    // 9. Retrieve and update sitemap.xml
    const existingSitemap = await getRepoFile(sitemapPath).catch(() => null);
    const canonicalUrl = blog.canonical_url || `${siteOrigin.replace(/\/$/, '')}/${blogDir}/${blog.slug}.html`;
    const updatedSitemapXml = updateSitemapXml(
      existingSitemap ? existingSitemap.content : null,
      canonicalUrl,
      publishedAt
    );

    // 10. Commit files to GitHub repository
    const articleFilePath = `${blogDir}/${blog.slug}.html`;
    const filesToCommit = [
      { path: articleFilePath, content: articleHtml },
      { path: listingPath, content: updatedListingHtml },
      { path: sitemapPath, content: updatedSitemapXml },
    ];

    let commitResult;
    try {
      commitResult = await commitFilesToRepo(
        filesToCommit,
        `Publish blog: "${blog.title}" (${blog.slug})`
      );
    } catch (githubErr) {
      // Check if GitHub credentials are unset (local test environment)
      if (!process.env.GITHUB_TOKEN) {
        console.warn('GITHUB_TOKEN not configured. Running in simulated publishing mode.');
        commitResult = {
          commitSha: 'simulated-' + Math.random().toString(36).substring(2, 10),
          commitUrl: `https://github.com/mock/repo/commit/simulated`,
        };
      } else {
        throw githubErr;
      }
    }

    // 11. Update database record with published state
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
    }

    return res.status(200).json({
      success: true,
      message: 'Blog successfully published and committed.',
      commitSha: commitResult.commitSha,
      commitUrl: commitResult.commitUrl,
      publicUrl: canonicalUrl,
    });
  } catch (error) {
    console.error('Publishing error:', error);

    // Reset status to draft or record error in database if possible
    if (blogId && supabase) {
      await supabase
        .from('blogs')
        .update({
          status: 'draft',
          last_publish_error: error.message || 'Unknown publishing failure',
        })
        .eq('id', blogId)
        .catch(() => {});
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while publishing blog.',
    });
  }
}
