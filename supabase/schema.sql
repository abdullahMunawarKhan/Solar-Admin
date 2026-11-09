-- ==============================================================================
-- Supabase Schema & Security Setup for Blog Management Dashboard
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the `admin_users` table for authorized administrators
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for admin_users
-- Admins can read admin_users list
CREATE POLICY "Admins can view admin_users"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 3. Create the `blogs` Table
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
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_commit_sha TEXT,
    last_publish_error TEXT
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at DESC);

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blogs_updated_at ON public.blogs;
CREATE TRIGGER trigger_blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Row Level Security (RLS) for `blogs`
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Deny all anonymous/public access by default (public website consumes static HTML, not the DB)
-- Only authenticated authorized administrators can manage blogs
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

-- 5. Storage Bucket Configuration for Blog Images
-- Run this in the Supabase SQL Editor to initialize the bucket:
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

-- Storage RLS Policies:
-- Allow public to read/view blog images
CREATE POLICY "Public Read Access for Blog Images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'blog-images');

-- Allow authenticated admins to upload images
CREATE POLICY "Admin Upload Access for Blog Images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'blog-images'
        AND public.is_admin()
    );

-- Allow authenticated admins to update/replace images
CREATE POLICY "Admin Update Access for Blog Images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'blog-images'
        AND public.is_admin()
    );

-- Allow authenticated admins to delete images
CREATE POLICY "Admin Delete Access for Blog Images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'blog-images'
        AND public.is_admin()
    );

-- ==============================================================================
-- Initial Admin Setup Script
-- Replace 'admin@example.com' with your admin email once the user signs up
-- ==============================================================================
-- INSERT INTO public.admin_users (id, email, role)
-- SELECT id, email, 'admin'
-- FROM auth.users
-- WHERE email = 'admin@example.com';
