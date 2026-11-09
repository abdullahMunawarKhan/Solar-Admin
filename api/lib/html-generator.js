import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span',
    'figure', 'figcaption'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class', 'id', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: (tagName, attribs) => {
      // Ensure external links have safe rel attributes
      if (attribs.href && (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))) {
        attribs.rel = 'noopener noreferrer';
      }
      return { tagName, attribs };
    },
    img: (tagName, attribs) => {
      attribs.loading = 'lazy';
      return { tagName, attribs };
    },
  },
};

export function cleanHtml(dirtyHtml) {
  if (!dirtyHtml) return '';
  return sanitizeHtml(dirtyHtml, SANITIZE_OPTIONS);
}

function escape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a complete, standalone, SEO-optimized static HTML article page.
 * @param {Object} blog
 * @param {Object} config
 * @returns {string} HTML document string
 */
export function generateArticleHtml(blog, config = {}) {
  const siteOrigin = (config.siteOrigin || process.env.SITE_ORIGIN || 'https://www.proudindiansolar.com').replace(/\/$/, '');
  const blogDirectory = (config.blogDirectory || process.env.BLOG_OUTPUT_DIRECTORY || 'blog').replace(/^\/|\/$/g, '');
  
  const title = blog.title || 'Untitled Blog';
  const metaTitle = blog.meta_title || `${title} | Proud Indian Solar`;
  const metaDescription = blog.meta_description || blog.excerpt || '';
  const canonicalUrl = blog.canonical_url || `${siteOrigin}/${blogDirectory}/${blog.slug}.html`;
  const featuredImage = blog.featured_image || `${siteOrigin}/images/default-blog.jpg`;
  const imageAlt = blog.image_alt || title;
  const author = blog.author_name || 'Editorial Team';
  const category = blog.category || 'General';
  const publishedDate = blog.published_at ? new Date(blog.published_at).toISOString() : new Date().toISOString();
  const updatedDate = blog.updated_at ? new Date(blog.updated_at).toISOString() : publishedDate;
  const formattedDate = new Date(publishedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sanitizedContent = cleanHtml(blog.content_html || '');

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': title,
    'description': metaDescription,
    'image': [featuredImage],
    'datePublished': publishedDate,
    'dateModified': updatedDate,
    'author': {
      '@type': 'Person',
      'name': author,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Proud Indian Solar',
      'url': siteOrigin,
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    'articleSection': category,
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(metaTitle)}</title>
  <meta name="description" content="${escape(metaDescription)}">
  <link rel="canonical" href="${escape(canonicalUrl)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escape(canonicalUrl)}">
  <meta property="og:title" content="${escape(metaTitle)}">
  <meta property="og:description" content="${escape(metaDescription)}">
  <meta property="og:image" content="${escape(featuredImage)}">
  <meta property="og:site_name" content="Proud Indian Solar">
  <meta property="article:published_time" content="${escape(publishedDate)}">
  <meta property="article:modified_time" content="${escape(updatedDate)}">
  <meta property="article:section" content="${escape(category)}">
  
  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escape(canonicalUrl)}">
  <meta name="twitter:title" content="${escape(metaTitle)}">
  <meta name="twitter:description" content="${escape(metaDescription)}">
  <meta name="twitter:image" content="${escape(featuredImage)}">

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <!-- Google Fonts & Base CSS -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css" onerror="this.onerror=null;">

  <style>
    :root {
      --primary: #f59e0b;
      --primary-dark: #d97706;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --bg-light: #f8fafc;
      --border-color: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text-main);
      background-color: #ffffff;
      line-height: 1.7;
    }
    header.site-header {
      border-bottom: 1px solid var(--border-color);
      background: #ffffff;
      padding: 1rem 1.5rem;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .header-container {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .site-brand {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 800;
      font-size: 1.25rem;
      color: #0f172a;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .site-nav a {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      margin-left: 1.5rem;
      transition: color 0.15s ease;
    }
    .site-nav a:hover {
      color: var(--primary-dark);
    }
    .article-container {
      max-width: 820px;
      margin: 2.5rem auto 5rem;
      padding: 0 1.5rem;
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .breadcrumbs a {
      color: var(--text-muted);
      text-decoration: none;
    }
    .breadcrumbs a:hover {
      color: var(--primary-dark);
    }
    .article-category {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
    }
    h1.article-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.25;
      color: #0f172a;
      margin-bottom: 1.25rem;
      letter-spacing: -0.02em;
    }
    .article-meta {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      color: var(--text-muted);
      font-size: 0.9375rem;
      padding-bottom: 1.75rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 2rem;
    }
    .featured-image-wrapper {
      margin-bottom: 2.5rem;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      background-color: #f1f5f9;
    }
    .featured-image-wrapper img {
      width: 100%;
      height: auto;
      max-height: 480px;
      object-fit: cover;
      display: block;
    }
    .article-content {
      font-size: 1.125rem;
      line-height: 1.8;
      color: #334155;
    }
    .article-content h2 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      letter-spacing: -0.01em;
    }
    .article-content h3 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.35rem;
      font-weight: 600;
      color: #0f172a;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
    }
    .article-content p {
      margin-bottom: 1.5rem;
    }
    .article-content ul, .article-content ol {
      margin-bottom: 1.5rem;
      padding-left: 1.75rem;
    }
    .article-content li {
      margin-bottom: 0.5rem;
    }
    .article-content blockquote {
      border-left: 4px solid var(--primary);
      padding: 0.75rem 1.25rem;
      background: #fffbeb;
      margin: 1.75rem 0;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: #78350f;
    }
    .article-content a {
      color: #2563eb;
      text-decoration: underline;
    }
    .article-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.75rem 0;
    }
    .article-footer {
      margin-top: 3.5rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: #f1f5f9;
      color: #0f172a;
      text-decoration: none;
      font-weight: 600;
      border-radius: 8px;
      transition: background 0.15s ease;
    }
    .back-btn:hover {
      background: #e2e8f0;
    }
    footer.site-footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 3rem 1.5rem;
      text-align: center;
      font-size: 0.875rem;
    }
    footer.site-footer a {
      color: #e2e8f0;
      text-decoration: none;
    }
    @media (max-width: 768px) {
      h1.article-title { font-size: 1.875rem; }
      .article-content { font-size: 1rem; }
      .article-meta { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="site-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        <span>Proud Indian Solar</span>
      </a>
      <nav class="site-nav">
        <a href="/">Home</a>
        <a href="/about.html">About</a>
        <a href="/services.html">Services</a>
        <a href="/blogs.html">Blog</a>
        <a href="/contact.html">Contact</a>
      </nav>
    </div>
  </header>

  <main>
    <article class="article-container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/blogs.html">Blogs</a>
        <span>/</span>
        <span aria-current="page">${escape(title)}</span>
      </nav>

      <span class="article-category">${escape(category)}</span>
      <h1 class="article-title">${escape(title)}</h1>

      <div class="article-meta">
        <div>By <strong>${escape(author)}</strong></div>
        <div>Published on <strong>${escape(formattedDate)}</strong></div>
      </div>

      ${featuredImage ? `
      <figure class="featured-image-wrapper">
        <img src="${escape(featuredImage)}" alt="${escape(imageAlt)}" width="1200" height="630">
      </figure>
      ` : ''}

      <div class="article-content">
        ${sanitizedContent}
      </div>

      <div class="article-footer">
        <a href="/blogs.html" class="back-btn">&larr; Back to all blogs</a>
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} Proud Indian Solar. All rights reserved.</p>
  </footer>
</body>
</html>`;
}

/**
 * Updates or generates the `blogs.html` listing page.
 * If existingHtml is provided with delimiters `<!-- BLOGS_LIST_START -->` ... `<!-- BLOGS_LIST_END -->`,
 * it will cleanly inject the cards between the markers while preserving the rest of the site layout.
 * If no delimiters exist, it will construct a clean complete listing page.
 * @param {Array} publishedBlogs list of published blogs
 * @param {string|null} existingHtml
 * @param {Object} config
 * @returns {string}
 */
export function generateBlogsListingHtml(publishedBlogs, existingHtml = null, config = {}) {
  const blogDirectory = (config.blogDirectory || process.env.BLOG_OUTPUT_DIRECTORY || 'blog').replace(/^\/|\/$/g, '');

  const cardsHtml = (publishedBlogs || [])
    .map((blog) => {
      const url = `/${blogDirectory}/${blog.slug}.html`;
      const dateStr = blog.published_at
        ? new Date(blog.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';
      const image = blog.featured_image || '/images/default-blog.jpg';
      const alt = blog.image_alt || blog.title;

      return `
        <article class="blog-card" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;">
          <a href="${escape(url)}" style="display: block; overflow: hidden; height: 210px; background: #f1f5f9;">
            <img src="${escape(image)}" alt="${escape(alt)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
          </a>
          <div style="padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1;">
            ${blog.category ? `<span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #d97706; margin-bottom: 0.5rem; letter-spacing: 0.05em;">${escape(blog.category)}</span>` : ''}
            <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.4;">
              <a href="${escape(url)}" style="color: inherit; text-decoration: none;">${escape(blog.title)}</a>
            </h2>
            <p style="font-size: 0.9375rem; color: #64748b; line-height: 1.6; margin-bottom: 1.25rem; flex-grow: 1;">
              ${escape(blog.excerpt || '')}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
              <span>By ${escape(blog.author_name || 'Admin')}</span>
              <span>${escape(dateStr)}</span>
            </div>
          </div>
        </article>`;
    })
    .join('\n');

  const START_MARKER = '<!-- BLOGS_LIST_START -->';
  const END_MARKER = '<!-- BLOGS_LIST_END -->';

  if (existingHtml && existingHtml.includes(START_MARKER) && existingHtml.includes(END_MARKER)) {
    const startIndex = existingHtml.indexOf(START_MARKER) + START_MARKER.length;
    const endIndex = existingHtml.indexOf(END_MARKER);
    return (
      existingHtml.substring(0, startIndex) +
      `\n<div class="blogs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; margin-top: 2rem;">\n` +
      cardsHtml +
      `\n</div>\n` +
      existingHtml.substring(endIndex)
    );
  }

  // Standalone complete blogs.html
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blog &amp; Solar Insights | Proud Indian Solar</title>
  <meta name="description" content="Read the latest articles, solar panel guides, and renewable energy insights from Proud Indian Solar.">
  <link rel="canonical" href="${(config.siteOrigin || process.env.SITE_ORIGIN || 'https://www.proudindiansolar.com').replace(/\/$/, '')}/blogs.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    header.site-header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 1.25rem 1.5rem; }
    .header-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
    .site-brand { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.25rem; color: #0f172a; text-decoration: none; }
    .site-nav a { margin-left: 1.5rem; text-decoration: none; color: #64748b; font-weight: 500; }
    .site-nav a:hover, .site-nav a.active { color: #d97706; }
    .page-hero { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 4rem 1.5rem 3.5rem; text-align: center; }
    .page-hero h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; }
    .page-hero p { color: #64748b; font-size: 1.125rem; max-width: 600px; margin: 0 auto; }
    .container { max-width: 1200px; margin: 3rem auto; padding: 0 1.5rem; }
    footer.site-footer { background: #0f172a; color: #94a3b8; padding: 2.5rem 1.5rem; text-align: center; margin-top: 5rem; }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="site-brand">Proud Indian Solar</a>
      <nav class="site-nav">
        <a href="/">Home</a>
        <a href="/about.html">About</a>
        <a href="/services.html">Services</a>
        <a href="/blogs.html" class="active">Blog</a>
        <a href="/contact.html">Contact</a>
      </nav>
    </div>
  </header>

  <section class="page-hero">
    <h1>Our Latest Articles &amp; Insights</h1>
    <p>Expert tips, technical guides, and government scheme updates for solar energy adoption.</p>
  </section>

  <main class="container">
    <!-- BLOGS_LIST_START -->
    <div class="blogs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem;">
      ${cardsHtml}
    </div>
    <!-- BLOGS_LIST_END -->
  </main>

  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} Proud Indian Solar. All rights reserved.</p>
  </footer>
</body>
</html>`;
}

/**
 * Adds or updates an entry in `sitemap.xml`.
 * @param {string|null} existingXml
 * @param {string} canonicalUrl
 * @param {string} lastmod ISO date string
 * @returns {string} updated XML
 */
export function updateSitemapXml(existingXml, canonicalUrl, lastmod) {
  const formattedLastmod = (lastmod ? new Date(lastmod) : new Date()).toISOString().split('T')[0];
  const urlEntry = `  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${formattedLastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  if (!existingXml || !existingXml.includes('<urlset')) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntry}
</urlset>`;
  }

  // Check if URL already in sitemap
  const escapedUrl = canonicalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\s*<url>[\\s\\S]*?<loc>${escapedUrl}</loc>[\\s\\S]*?</url>`, 'g');

  if (regex.test(existingXml)) {
    // Replace existing entry with updated lastmod
    return existingXml.replace(regex, `\n${urlEntry}`);
  }

  // Insert before closing </urlset>
  return existingXml.replace('</urlset>', `${urlEntry}\n</urlset>`);
}

/**
 * Removes an entry from `sitemap.xml`.
 * @param {string} existingXml 
 * @param {string} canonicalUrl 
 * @returns {string}
 */
export function removeUrlFromSitemap(existingXml, canonicalUrl) {
  if (!existingXml) return existingXml;
  const escapedUrl = canonicalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\s*<url>[\\s\\S]*?<loc>${escapedUrl}</loc>[\\s\\S]*?</url>`, 'g');
  return existingXml.replace(regex, '');
}
