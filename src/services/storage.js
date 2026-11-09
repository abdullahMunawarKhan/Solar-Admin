import { supabase } from './supabase';

const BUCKET_NAME = 'blog-images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

/**
 * Validates an image file before upload.
 * @param {File} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type}). Allowed types: JPEG, PNG, WebP, GIF, SVG.`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.`,
    };
  }
  return { valid: true };
}

/**
 * Uploads a blog featured image to Supabase Storage.
 * @param {File} file 
 * @param {string} [slug] optional blog slug for organizational path
 * @returns {Promise<{ publicUrl: string, storagePath: string }>}
 */
export async function uploadBlogImage(file, slug = 'general') {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 30);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `${year}/${month}/${cleanBaseName}-${randomSuffix}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    publicUrl: publicUrlData.publicUrl,
    storagePath: data.path,
  };
}

/**
 * Deletes an image from Supabase Storage by path.
 * @param {string} storagePath 
 */
export async function deleteBlogImage(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) {
    console.warn(`Could not delete image at ${storagePath}:`, error.message);
  }
}
