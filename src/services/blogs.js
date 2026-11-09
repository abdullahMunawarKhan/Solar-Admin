import { supabase } from './supabase';

/**
 * Fetches blogs with filtering, searching, and sorting.
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function fetchBlogs({
  search = '',
  status = 'all',
  category = 'all',
  sortBy = 'created_at',
  sortOrder = 'desc',
} = {}) {
  let query = supabase
    .from('blogs')
    .select('id, title, slug, excerpt, featured_image, image_alt, author_name, category, status, published_at, created_at, updated_at, published_commit_sha, last_publish_error');

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%,excerpt.ilike.%${term}%`);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load blogs: ${error.message}`);
  }
  return data || [];
}

/**
 * Fetches a single blog by ID with full content.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchBlogById(id) {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Blog not found: ${error.message}`);
  }
  return data;
}

/**
 * Checks if a slug is already taken by another blog.
 * @param {string} slug 
 * @param {string} [excludeId] 
 * @returns {Promise<boolean>} returns true if available
 */
export async function checkSlugAvailable(slug, excludeId = null) {
  let query = supabase
    .from('blogs')
    .select('id')
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error checking slug:', error);
    return false;
  }
  return data.length === 0;
}

/**
 * Creates a new blog post.
 * @param {Object} blogData
 * @returns {Promise<Object>}
 */
export async function createBlog(blogData) {
  const payload = {
    ...blogData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('blogs')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create blog: ${error.message}`);
  }
  return data;
}

/**
 * Updates an existing blog post.
 * @param {string} id 
 * @param {Object} blogData 
 * @returns {Promise<Object>}
 */
export async function updateBlog(id, blogData) {
  const payload = {
    ...blogData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('blogs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update blog: ${error.message}`);
  }
  return data;
}

/**
 * Deletes a blog post by ID.
 * @param {string} id 
 */
export async function deleteBlog(id) {
  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete blog: ${error.message}`);
  }
}

/**
 * Fetches dashboard statistics.
 * @returns {Promise<{ total: number, published: number, draft: number, archived: number }>}
 */
export async function fetchBlogStats() {
  const { data, error } = await supabase
    .from('blogs')
    .select('status');

  if (error) {
    console.warn('Failed to load blog stats:', error.message);
    return { total: 0, published: 0, draft: 0, archived: 0 };
  }

  const stats = {
    total: data.length,
    published: 0,
    draft: 0,
    archived: 0,
  };

  data.forEach((item) => {
    if (item.status in stats) {
      stats[item.status]++;
    }
  });

  return stats;
}
