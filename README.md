# Solar-Admin — Blog Management Dashboard

A secure, high-performance content management dashboard for managing the blog section of the **Proud Indian Solar** static website.

The dashboard is a standalone React 18 + Vite application hosted on **Netlify** with serverless **Netlify Functions v2**. It uses **Supabase** for administrative authentication, PostgreSQL database storage, and image CDN storage. When an authorized administrator publishes or unpublishes a blog, a server-side publishing function generates SEO-optimized static HTML, updates `blogs.html` and `sitemap.xml`, and commits the changes atomically to the main website GitHub repository (`abdullahMunawarKhan/Solar-Agency-`), triggering **Vercel** continuous deployment for the live website at `https://www.proudindiansolar.com`.

> **Scope: Blogs CMS.** Focused strictly on blog authoring, previewing, static generation, and Git-backed publishing.

---

## 1. Confirmed Phase 2 Architecture

| Area | Service / Technology | Deployment / Details |
| :--- | :--- | :--- |
| **Dashboard UI** | React 18 + Vite (JavaScript / JSX) | Hosted on **Netlify** (SPA fallback enabled) |
| **Backend & Auth** | Supabase Auth + PostgreSQL | Hardened RLS policies + `public.admin_users` table |
| **Media Storage** | Supabase Storage (`blog-images`) | 5 MB upload limit, public read, admin-only write |
| **Rich-Text Editor** | TipTap React | Headless, extensible WYSIWYG editor |
| **Publishing Functions** | **Netlify Functions v2** | Standard Web `Request` / `Response` at `/api/*` |
| **Git Integration** | GitHub REST API (Git Database Trees & Blobs) | Atomic multi-file commits without cloning |
| **Main Website** | Static HTML / CSS / JS | Hosted on **Vercel** (`https://www.proudindiansolar.com`) |
| **Main Website Repo** | GitHub: `abdullahMunawarKhan/Solar-Agency-` | Branch: `main` (or configured test branch) |

---

## 2. Architecture & Data Flow

```text
                  +----------------------------------------------+
                  |         Administrator (Browser)              |
                  +----------------------------------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |    Solar-Admin Dashboard (Hosted on Netlify) |
                  |    - React 18 + Vite SPA                     |
                  |    - TipTap Rich Text Editor                 |
                  |    - Browser-safe Supabase Client            |
                  +----------------------------------------------+
                         |                              |
           Auth & State  |                              | POST /api/publish-blog
                         v                              v (Bearer Session Token)
    +-----------------------------+     +----------------------------------+
    |       Supabase Cloud        |     |  Netlify Functions v2 (Server)   |
    | - auth.users (Credentials)  |     | 1. Extract Bearer JWT            |
    | - public.admin_users (RLS)  |<--->| 2. Auth via Supabase Admin SDK   |
    | - public.blogs (Records)    |     | 3. Authorize via admin_users     |
    | - Storage: blog-images      |     | 4. Fetch blog & generate HTML    |
    +-----------------------------+     +----------------------------------+
                                                        |
                                                        | Atomic Commit (Trees API)
                                                        v
                                        +----------------------------------+
                                        | GitHub: abdullahMunawarKhan/     |
                                        |         Solar-Agency-            |
                                        | - /blog/<slug>.html              |
                                        | - blogs.html                     |
                                        | - sitemap.xml                    |
                                        +----------------------------------+
                                                        |
                                                        | Git Push Webhook
                                                        v
                                        +----------------------------------+
                                        |  Vercel Continuous Deployment    |
                                        |  Live: www.proudindiansolar.com  |
                                        +----------------------------------+
```

---

## 3. Security Hardening & Administrator Privileges

### Authoritative Database RBAC
- **No Client Metadata Trust**: Neither `user_metadata` nor `app_metadata` is ever trusted for administrative privileges. Any user can theoretically edit client metadata; therefore, authorization is exclusively determined by existence and `role = 'admin'` in the `public.admin_users` table.
- **Server-Side Enforcement**: Netlify Functions independently extract the JWT from the `Authorization: Bearer <token>` header, verify it against Supabase Auth, and query `public.admin_users` with the privileged service role. Unauthenticated requests are rejected with `401`, and non-admin authenticated users are rejected with `403`.
- **Zero Client Exposure of Secrets**: `SUPABASE_SERVICE_ROLE_KEY` and `GITHUB_TOKEN` are strictly server-side environment variables. Vite only bundles safe variables prefixed with `VITE_`.
- **Hardened PostgreSQL Stored Functions**: `public.is_admin()` and `public.handle_updated_at()` are secured with:
  ```sql
  SET search_path = public, pg_temp;
  ```
  preventing search_path hijacking attacks (CVE-2018-1058), and use fully-qualified references (`public.admin_users`).

### Safe Publishing & Rollback
- **No Simulated Publishing**: Fake commit generation has been completely removed. Missing credentials fail immediately with an informative server-side error.
- **Atomic Commits**: Articles, the blog directory listing (`blogs.html`), and `sitemap.xml` are committed together in a single atomic Git tree.
- **Fail-Safe Database Status**: A blog is **never** marked `published` in Supabase unless the GitHub commit succeeds. If a commit fails, the database reverts the post status and logs `last_publish_error`.

---

## 4. Initial Administrator Bootstrap Procedure

Public administrator registration is intentionally disabled to prevent unauthorized account creation.

To authorize the first administrator:

1. **Create the User Account**:
   - In Supabase Dashboard, navigate to **Authentication** > **Users** > **Add User** (Create user with email/password, or invite by email).
2. **Authorize in Database**:
   - In Supabase Dashboard, open the **SQL Editor** and run:
     ```sql
     INSERT INTO public.admin_users (id, email, role)
     SELECT id, email, 'admin'
     FROM auth.users
     WHERE email = 'admin@proudindiansolar.com'
     ON CONFLICT (id) DO UPDATE SET role = 'admin';
     ```
3. **Verify Authorization**:
     ```sql
     SELECT * FROM public.admin_users WHERE email = 'admin@proudindiansolar.com';
     ```

---

## 5. Environment Variables Configuration

Copy `.env.example` to `.env` for local development. In production, configure variables in **Netlify Dashboard > Site Configuration > Environment variables**.

```env
# -------------------------------------------------------------
# Browser-Safe Client Variables (Exposed via Vite)
# -------------------------------------------------------------
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SITE_ORIGIN=https://www.proudindiansolar.com

# -------------------------------------------------------------
# Server-Side Secrets (Netlify Functions v2 & Local Server)
# -------------------------------------------------------------
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# GitHub Integration
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_OWNER=abdullahMunawarKhan
GITHUB_MAIN_WEBSITE_REPO=Solar-Agency-
GITHUB_MAIN_WEBSITE_BRANCH=preview-test

# Site & Publishing Paths
SITE_ORIGIN=https://www.proudindiansolar.com
BLOG_OUTPUT_DIRECTORY=blog
BLOGS_LISTING_PATH=blogs.html
SITEMAP_PATH=sitemap.xml
PORT=3001
```

> **Testing Recommendation**: Set `GITHUB_MAIN_WEBSITE_BRANCH=preview-test` (or another dedicated test branch) for initial publishing tests before targeting `main`.

---

## 6. Local Development & Testing

### Option A: Netlify Dev Workflow (Recommended)
Simulates the Netlify production environment, functions, and rewrites:
```bash
npx netlify dev
```
- Dashboard runs at `http://localhost:8888`
- API functions route at `http://localhost:8888/api/publish-blog`

### Option B: Vite + Node Server Workflow
Run Vite for the frontend and the lightweight Node adapter for publishing functions:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Publishing Functions API
npm run server
```
- Frontend: `http://localhost:5173`
- API Proxy: Vite automatically proxies `/api/*` to `http://localhost:3001`

### Build Verification
```bash
npm run build
```
Builds the production bundle into `dist/` with code splitting for React, Supabase, and TipTap.

---

## 7. Netlify Deployment Details

The repository includes `netlify.toml` configured for Netlify:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- **API Rewrites**: `/api/*` -> `/.netlify/functions/:splat` (status 200)
- **SPA Fallback**: `/*` -> `/index.html` (status 200, evaluated after API rewrites)
