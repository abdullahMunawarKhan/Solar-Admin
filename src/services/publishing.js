import { supabase } from './supabase';

/**
 * Publishes a blog post to the static website repository via server-side endpoint.
 * @param {string} blogId 
 * @returns {Promise<{ success: boolean, commitSha?: string, publicUrl?: string, message: string }>}
 */
export async function publishBlog(blogId) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('You must be signed in to publish a blog post.');
  }

  const response = await fetch('/api/publish-blog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ blogId }),
  });

  const result = await response.json().catch(() => ({
    error: 'Invalid response from publishing server',
  }));

  if (!response.ok) {
    throw new Error(result.error || result.message || `Publishing failed with status ${response.status}`);
  }

  return result;
}

/**
 * Unpublishes a blog post (reverts to draft/archived and removes static file / sitemap entry).
 * @param {string} blogId 
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function unpublishBlog(blogId) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('You must be signed in to unpublish a blog post.');
  }

  const response = await fetch('/api/unpublish-blog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ blogId }),
  });

  const result = await response.json().catch(() => ({
    error: 'Invalid response from publishing server',
  }));

  if (!response.ok) {
    throw new Error(result.error || result.message || `Unpublishing failed with status ${response.status}`);
  }

  return result;
}
