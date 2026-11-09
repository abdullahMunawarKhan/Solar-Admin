/**
 * Converts a string into a normalized, URL-safe slug.
 * @param {string} text 
 * @returns {string}
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // decompose combined graphemes
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/[\s_]+/g, '-') // replace spaces & underscores with hyphen
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Validates a slug format.
 * @param {string} slug 
 * @returns {boolean}
 */
export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
