# Blog Management Dashboard

A separate, secure content-management dashboard for managing the blog
section of an existing static HTML business website.

The dashboard is a standalone React application. It uses Supabase for
authentication, database storage, and image storage. When an
administrator publishes a blog, a secure server-side publishing function
generates SEO-friendly static HTML files, commits the generated files to
the existing main-website GitHub repository, and lets the existing
Netlify site deploy the update.

> **Current scope: Blogs only.** Do not implement project management,
> galleries, CRM, financial management, or unrelated CMS modules.
> Projects may be considered as a separate future phase.

------------------------------------------------------------------------

## 1. Project goals

Build an easy-to-use admin dashboard that allows an authorised
administrator to:

-   Sign in securely.
-   Create, edit, preview, publish, unpublish, and delete blog posts.
-   Write content using a rich-text editor.
-   Upload and select featured images.
-   Set SEO metadata and a clean URL slug.
-   Save unfinished posts as drafts.
-   Publish a blog without manually editing or uploading HTML files.
-   View the publication status and publishing result.

The dashboard must be independent of the existing public website. Do not
convert the existing website into React or change its existing pages as
part of this project.

## 2. Technology stack

  -----------------------------------------------------------------------
  Area                                Technology
  ----------------------------------- -----------------------------------
  Frontend framework                  React

  Language                            JavaScript with JSX (not
                                      TypeScript)

  Build tool                          Vite

  Styling                             CSS (or an agreed lightweight CSS
                                      framework)

  Authentication                      Supabase Auth

  Database                            Supabase PostgreSQL

  Image storage                       Supabase Storage

  Rich-text editor                    TipTap or another maintained
                                      React-compatible editor

  Dashboard hosting                   Vercel

  Source control                      GitHub

  Main website hosting                Existing Netlify project

  Publishing                          Secure server-side API/function +
                                      GitHub API

  Public blog output                  Static, SEO-ready HTML
  -----------------------------------------------------------------------

Use JavaScript and `.jsx` files throughout the React application. Do not
introduce TypeScript unless explicitly approved.

## 3. High-level architecture

``` text
Administrator
     |
     v
React + Vite dashboard (deployed on Vercel)
     |
     +---- Supabase Auth (administrator login)
     |
     +---- Supabase PostgreSQL (blog records)
     |
     +---- Supabase Storage (featured images)
     |
     v
Secure server-side publishing endpoint
     |
     +---- Reads the selected published blog from Supabase
     +---- Generates a complete static HTML page
     +---- Updates blogs.html and sitemap.xml
     +---- Commits generated files to the MAIN WEBSITE GitHub repository
     |
     v
GitHub main-website repository
     |
     v
Existing Netlify continuous deployment
     |
     v
https://www.example.com/blog/<slug>.html
```

The dashboard repository and the main website repository are separate
projects. The publishing integration must write only to the configured
main-website repository and approved paths.

### Important deployment rule

Netlify deploys the updated site from the repository after a commit. A
deployment is a new version of the complete published site, not an
in-place edit of one live file. The publishing process must preserve all
existing website files and must never replace the main website with a
blog-only folder.

## 4. Suggested dashboard structure

``` text
blog-admin/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   ├── editor/
│   │   ├── forms/
│   │   └── common/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── BlogsList.jsx
│   │   ├── CreateBlog.jsx
│   │   ├── EditBlog.jsx
│   │   └── BlogPreview.jsx
│   ├── services/
│   │   ├── supabase.js
│   │   ├── blogs.js
│   │   └── publishing.js
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── api/
│   └── publish-blog.js
├── .env.example
├── index.html
├── package.json
└── README.md
```

This is a suggested structure, not a reason to create unnecessary
abstractions. Keep the implementation maintainable and straightforward.

## 5. Blog content model

Create a `blogs` table in Supabase PostgreSQL.

Suggested columns:

  -----------------------------------------------------------------------
  Column                              Type / purpose
  ----------------------------------- -----------------------------------
  `id`                                UUID primary key

  `title`                             Blog title

  `slug`                              Unique URL slug

  `excerpt`                           Short summary for the listing page

  `content`                           Rich-text content stored in a
                                      documented format, such as JSON

  `content_html`                      Optional sanitised HTML
                                      representation if needed by the
                                      renderer

  `featured_image`                    Public image URL or storage path

  `image_alt`                         Accessible image description

  `meta_title`                        SEO title

  `meta_description`                  SEO description

  `canonical_url`                     Optional canonical URL; otherwise
                                      generate the canonical URL from the
                                      configured site origin and slug

  `author_name`                       Display author

  `category`                          Optional blog category

  `status`                            `draft`, `published`, or `archived`

  `published_at`                      Publication timestamp

  `created_at`                        Creation timestamp

  `updated_at`                        Last update timestamp

  `published_commit_sha`              Optional Git commit identifier for
                                      traceability

  `last_publish_error`                Optional publishing error
                                      information
  -----------------------------------------------------------------------

Requirements:

-   Enforce uniqueness on `slug`.
-   Store timestamps consistently (UTC in the database; display in the
    administrator's local timezone).
-   Validate and normalise slugs.
-   Do not trust client-provided HTML. Sanitize rendered HTML before
    publishing.
-   Do not expose draft content to anonymous/public users.
-   A draft save must not trigger a production deployment.

## 6. Authentication and database security

Use Supabase Auth for administrator sign-in.

Requirements:

1.  Only explicitly authorised administrator accounts can access
    dashboard pages and write blog content.
2.  Enable Row Level Security (RLS) on all tables exposed through the
    Supabase API.
3.  Add policies that permit authenticated authorised administrators to
    create, read, update, and delete blog records.
4.  Public/anonymous access must not expose drafts or private
    administrative data.
5.  The public website does not need to log in to display published
    static HTML pages.
6.  Do not add a public write policy.
7.  Do not rely only on hiding dashboard routes in React; enforce
    permissions in Supabase and on the server.
8.  Provide a safe initial administrator setup process. Do not allow
    unrestricted public sign-up to grant administrator access.

Use a Supabase publishable key in the browser only where appropriate and
protected by RLS. Never put a Supabase secret/service-role key, GitHub
token, GitHub App private key, or Netlify deploy credential in frontend
code, committed files, or browser-accessible environment variables.

## 7. Image storage

Create a Supabase Storage bucket for blog images.

Requirements:

-   Define allowed file types (for example JPEG, PNG, and WebP).
-   Enforce a reasonable upload size limit.
-   Validate file type and size.
-   Use unique, predictable-safe storage paths; do not trust
    user-supplied filenames.
-   Generate and store image alternative text.
-   Use stable public image URLs for published images, or another
    delivery approach that does not require an authenticated browser
    session.
-   Do not delete an image that is still referenced by a published blog.
-   Optimise images where practical; do not store unnecessarily huge
    originals as the only website image.

## 8. Dashboard features

### Authentication

-   Login screen.
-   Logout.
-   Protected dashboard routes.
-   Session persistence and sensible expired-session handling.
-   Clear unauthorised-access messages.

### Blog list

Show at least:

-   Title
-   Slug
-   Status
-   Category
-   Created date
-   Published date
-   Last updated date
-   Actions: Edit, Preview, Publish/Unpublish, Delete

Include search and status filtering.

### Create and edit blog

Fields:

-   Blog title
-   URL slug (suggest from title, but allow editing)
-   Excerpt
-   Rich-text body
-   Featured image upload/selection
-   Image alt text
-   Author
-   Category
-   SEO title
-   SEO meta description
-   Optional canonical URL

Editor capabilities should include headings, paragraphs, bold, italic,
ordered and unordered lists, links, blockquotes, and images if supported
reliably.

### Draft and preview

-   Save draft without deploying.
-   Preview the actual blog layout before publishing.
-   Preview must clearly indicate that it is not yet public.
-   Warn before leaving with unsaved changes.
-   Validate required fields before publication.

### Publishing states

Use explicit states and feedback:

-   Draft
-   Publishing
-   Published
-   Publish failed
-   Archived

Prevent duplicate simultaneous publishing actions for the same post.
Show useful error details without leaking secrets.

## 9. Static HTML publishing requirements

The publishing service must generate a complete standalone HTML document
for each published blog.

Example public URL:

``` text
https://www.example.com/blog/solar-panel-maintenance-tips.html
```

Example main website structure:

``` text
main-website/
├── index.html
├── about.html
├── services.html
├── contact.html
├── blogs.html
├── blog/
│   ├── solar-panel-maintenance-tips.html
│   └── pm-surya-ghar-guide.html
├── css/
├── js/
├── images/
├── sitemap.xml
└── robots.txt
```

The actual paths must be configurable to match the existing website
repository. Do not assume this example structure is identical to the
production website.

Each generated blog HTML page must include:

-   Correct `<!doctype html>`, language attribute, charset, and
    viewport.
-   Unique page title.
-   Unique meta description.
-   Canonical URL.
-   Open Graph title, description, URL, and image.
-   Appropriate Twitter/X card metadata.
-   One clear H1 and semantic H2/H3 hierarchy.
-   Readable, accessible article markup.
-   Featured image with useful alt text.
-   Author and publication date where available.
-   Relevant internal links.
-   Breadcrumb navigation where appropriate.
-   `BlogPosting` JSON-LD structured data with accurate values.
-   Mobile-responsive styling consistent with the existing website.
-   Fast-loading assets and no unnecessary client-side dependency for
    the article body.

Escape text correctly and sanitize rich-text HTML. Never interpolate
untrusted content into scripts, attributes, or raw HTML without
validation and sanitisation.

Use the configured production domain for canonical URLs and structured
data. Never use the Vercel dashboard URL as the canonical blog domain.

## 10. Blog listing page (`blogs.html`)

The publishing process must update the existing `blogs.html` page or a
clearly defined blog listing fragment used by it.

Requirements:

-   Show published blogs only.
-   Display featured image, title, excerpt, category (if present),
    publication date, and a link to the article.
-   Sort by publication date, newest first.
-   Link to the generated static HTML article URL.
-   Escape all displayed values.
-   Do not require a public Supabase query to render the listing if the
    generator can produce static HTML.
-   Preserve the existing website's layout, navigation, header, footer,
    fonts, and design conventions.
-   Do not overwrite unrelated content in `blogs.html`.

Prefer generating the listing from a known template or a clearly
delimited generated section rather than performing fragile text
replacement.

## 11. Sitemap and indexing

On successful publish:

-   Add the canonical blog URL to `sitemap.xml`.
-   Set an accurate `lastmod` value.
-   Keep existing URLs in the sitemap.
-   Avoid duplicate entries.
-   Ensure the blog page is not accidentally marked `noindex`.
-   Preserve the site's existing `robots.txt` rules.
-   Do not claim that a page is indexed just because it has been
    deployed. Search-engine crawling and indexing happen separately.

On unpublish or deletion, remove the URL from the sitemap and apply a
deliberate URL policy. Prefer a `410 Gone` response or a relevant
redirect for removed public URLs where the hosting setup supports it. Do
not silently leave stale sitemap entries or broken internal links.

## 12. Secure publishing integration

Publishing must run server-side, never directly from the browser.

Recommended approach:

-   A Vercel server-side API route or serverless function receives an
    authenticated publish request.
-   Verify the Supabase user session and administrator permission on the
    server.
-   Fetch the blog record from Supabase on the server.
-   Confirm the post is valid and intended for publication.
-   Generate the HTML page and updated listing/sitemap.
-   Commit only the generated files to the configured main-website
    GitHub repository using a GitHub App or a narrowly scoped
    fine-grained token.
-   Use the GitHub Contents API or Git Trees API as appropriate.
-   Handle file SHA requirements when updating existing files.
-   Avoid overwriting unrelated files or losing concurrent changes.
-   Record the commit SHA and publishing result.
-   Let the existing Netlify Git integration deploy the commit.

The GitHub credential must have access only to the required repository
and minimum required contents permissions. Store credentials as Vercel
server-side environment variables or secure platform secrets.

If a Netlify deploy webhook is used instead of Git-based continuous
deployment, keep it server-side and secure. Do not trigger both
mechanisms unnecessarily.

### Concurrency and reliability

-   Prevent duplicate publish operations.
-   Handle GitHub API rate limits and transient errors.
-   Detect conflicting repository changes and retry safely where
    possible.
-   Do not mark a blog as fully published until the Git commit succeeds.
-   Distinguish "commit created" from "Netlify deployment completed" if
    deployment status is available.
-   Keep a publishing log with timestamps, blog ID, commit SHA, status,
    and safe error details.
-   Make retries idempotent.

## 13. Environment variables

Create `.env.example` with placeholder names only.

Example:

``` env
# Browser-safe Supabase configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Server-side only: never prefix these with VITE_
SUPABASE_URL=
SUPABASE_SECRET_KEY=

GITHUB_APP_ID=
GITHUB_INSTALLATION_ID=
GITHUB_PRIVATE_KEY=

GITHUB_OWNER=
GITHUB_MAIN_WEBSITE_REPO=
GITHUB_MAIN_WEBSITE_BRANCH=main

SITE_ORIGIN=https://www.example.com
BLOGS_LISTING_PATH=blogs.html
BLOG_OUTPUT_DIRECTORY=blog
SITEMAP_PATH=sitemap.xml
```

Use the current Supabase key format supported by the project. If a
legacy key is used temporarily, document it and keep it server-side when
privileged. Never commit actual secrets. Configure production values in
Vercel project settings.

Do not assume the production domain, GitHub repository, branch, or
website paths until they are confirmed.

## 14. User experience and design

Build a clean, professional, responsive admin interface.

Suggested dashboard navigation:

-   Overview
-   All Blogs
-   Add New Blog
-   Media (only if needed for blog images)
-   Settings (only essential blog/publishing settings)

Priorities:

-   Desktop-first but fully usable on mobile.
-   Clear status labels and publishing feedback.
-   Simple forms with validation.
-   Comfortable writing experience.
-   Confirmation before destructive actions.
-   Accessible labels, keyboard navigation, and visible focus states.
-   Loading, empty, success, and error states.
-   No decorative features that complicate the initial release.

## 15. Non-goals for this phase

Do not implement:

-   Project management or project publishing.
-   Project galleries.
-   Customer management or CRM.
-   Payments or subscriptions.
-   Financial management.
-   Public user accounts or comments.
-   A replacement for the existing main website.
-   A migration of the existing website to React.
-   A new Netlify production site.
-   Automatic AI-written blog content.
-   Unrequested analytics integrations.

Keep the code modular enough to add future modules, but do not build
them now.

## 16. Development and implementation instructions for Antigravity

Before making changes:

1.  Inspect the existing main website repository and deployment setup if
    access is provided.
2.  Identify its actual GitHub repository, branch, Netlify connection,
    root directory, shared CSS, navigation, footer, and current URL
    conventions.
3.  Do not modify the live website or production configuration during
    dashboard scaffolding.
4.  Create the dashboard as a separate React + Vite JavaScript/JSX
    project.
5.  Implement Supabase schema, RLS policies, authentication, and storage
    setup instructions.
6.  Build the blog dashboard and editor.
7.  Implement the server-side publishing function.
8.  Test HTML generation using sample content before connecting
    production publishing.
9.  Verify that generated HTML preserves the existing site's design and
    includes correct SEO metadata.
10. Test the GitHub commit against a test branch or test repository
    first.
11. Connect the production repository and Netlify deployment only after
    explicit configuration and verification.

Do not invent credentials, repository names, domains, or existing file
paths. Ask for missing configuration when necessary. Do not weaken RLS
or expose secrets to make a demo work.

## 17. Acceptance checklist

The project is ready for initial production use when all of the
following work:

-   [ ] Admin can sign in and sign out.
-   [ ] Unauthorised users cannot access dashboard functions.
-   [ ] Admin can create and save a draft.
-   [ ] Admin can edit and preview a draft.
-   [ ] Admin can upload a featured image.
-   [ ] Required SEO fields are validated.
-   [ ] Admin can publish a blog.
-   [ ] A complete static HTML article is generated.
-   [ ] The article is committed to the correct main-website GitHub
    repository.
-   [ ] Netlify deploys the updated website.
-   [ ] The article URL works on the production domain.
-   [ ] `blogs.html` displays the new article.
-   [ ] `sitemap.xml` includes the new canonical URL.
-   [ ] Existing website pages and assets remain intact.
-   [ ] Drafts are not publicly exposed.
-   [ ] Secrets are absent from frontend bundles and Git history.
-   [ ] Publishing errors are visible and safely recoverable.
-   [ ] Unpublish/removal follows the defined URL and sitemap policy.

------------------------------------------------------------------------

## Final instruction

Build this as a focused, production-conscious **Blog Management
Dashboard** for an existing static HTML website. The dashboard is
separate from the public website. Use React with JavaScript/JSX,
Supabase Auth and PostgreSQL, Supabase Storage, Vercel hosting,
GitHub-based publishing, and the existing Netlify deployment.

Prioritise security, SEO, preservation of the existing website, and
reliable publishing. Do not expand the scope beyond blogs until
explicitly requested.
