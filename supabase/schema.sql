-- ==============================================================================
-- Supabase Schema & Security Hardening Setup for Solar-Admin Dashboard
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Administrator Users Table & Security Definer Function
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

/**
 * Hardened is_admin() Function
 * - SECURITY DEFINER: Executes with definer privileges.
 * - SET search_path = public, pg_temp: Prevents search_path hijacking attacks (CVE-2018-1058).
 * - Fully qualified table references: public.admin_users.
 * - Checks both user existence and explicit 'admin' role.
 */
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;

-- Strict RLS Policies on public.admin_users
-- Only already-authorized administrators can query, insert, update, or remove admin entries.
-- Anonymous and standard authenticated accounts have ZERO access to this table.
CREATE POLICY "Admins can view admin_users"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can insert admin_users"
    ON public.admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update admin_users"
    ON public.admin_users
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete admin_users"
    ON public.admin_users
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 3. Blogs Table & Triggers
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content JSONB,
    content_html TEXT,
    featured_image TEXT,
    image_alt TEXT,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    author_name TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'publishing', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_commit_sha TEXT,
    last_publish_error TEXT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at DESC);

-- Hardened updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_blogs_updated_at ON public.blogs;
CREATE TRIGGER trigger_blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on blogs table
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Blogs RLS Policies:
-- Only authenticated administrators can read, insert, modify, or delete blogs in the CMS.
-- The live website reads compiled static HTML committed to GitHub, NOT the Supabase database.
CREATE POLICY "Admins can select blogs"
    ON public.blogs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can insert blogs"
    ON public.blogs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update blogs"
    ON public.blogs
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete blogs"
    ON public.blogs
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 4. Storage Bucket Configuration for Blog Images
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blog-images',
    'blog-images',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage Policies with hardened checks:
CREATE POLICY "Public Read Access for Blog Images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'blog-images');

CREATE POLICY "Admin Upload Access for Blog Images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'blog-images'
        AND public.is_admin()
    );

CREATE POLICY "Admin Update Access for Blog Images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'blog-images'
        AND public.is_admin()
    );

CREATE POLICY "Admin Delete Access for Blog Images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'blog-images'
        AND public.is_admin()
    );

-- ==============================================================================
-- 5. SECURE INITIAL ADMINISTRATOR BOOTSTRAP PROCEDURE
-- ==============================================================================
-- IMPORTANT: Public registration of administrators is strictly prohibited
-- to prevent privilege escalation and unauthorized publication of static pages.
--
-- Procedure to authorize your initial administrator:
-- 1. Create the user in Supabase Auth (Dashboard > Authentication > Users > "Add user"
--    or through the application login screen with email verification).
-- 2. Obtain the user's UUID or registered email.
-- 3. Execute the following command directly in the Supabase SQL Editor
--    (which runs as a superuser/service-role, bypassing RLS):
--
-- INSERT INTO public.admin_users (id, email, role)
-- SELECT id, email, 'admin'
-- FROM auth.users
-- WHERE email = 'admin@proudindiansolar.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
--
-- 4. Verify admin authorization:
-- SELECT * FROM public.admin_users WHERE email = 'admin@proudindiansolar.com';
-- ==============================================================================
