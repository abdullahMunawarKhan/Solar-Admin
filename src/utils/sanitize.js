/**
 * Escapes HTML entities in untrusted plain text.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips HTML tags to get pure plain text (e.g. for excerpt or word count).
 * @param {string} html 
 * @returns {string}
 */
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Calculates estimated reading time in minutes.
 * @param {string} text 
 * @returns {number}
 */
export function getReadingTime(text) {
  const words = stripHtml(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
