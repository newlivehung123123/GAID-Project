/**
 * Slugify a string to match WordPress's sanitize_title() behavior
 * This function handles URL decoding, special characters, and converts to WordPress-style slugs
 * 
 * @param {string} str - The string to slugify
 * @returns {string} A WordPress-compatible slug
 */
export function slugify(str) {
  if (!str) return '';
  
  // First, decode URL-encoded characters (e.g., %E2%80%9C becomes ")
  try {
    str = decodeURIComponent(str);
  } catch (e) {
    // If decoding fails, try decodeURI
    try {
      str = decodeURI(str);
    } catch (e2) {
      // If both fail, use the original string
    }
  }
  
  // Convert to lowercase
  str = str.toLowerCase();
  
  // Replace common Unicode quotation marks and special characters
  str = str
    .replace(/[\u2018\u2019]/g, "'") // Left/right single quotation mark
    .replace(/[\u201C\u201D]/g, '"') // Left/right double quotation mark
    .replace(/[\u2013\u2014]/g, '-') // En dash, em dash
    .replace(/[\u2026]/g, '...')     // Ellipsis
    .replace(/[\u00A0]/g, ' ')       // Non-breaking space
    .replace(/&nbsp;/g, ' ')         // HTML non-breaking space
    .replace(/&hellip;/g, '...')     // HTML ellipsis
    .replace(/&[#\w]+;/g, '')       // Remove HTML entities
    .replace(/['"]/g, '')            // Remove remaining quotes
    .replace(/[^\w\s-]/g, '')       // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
  
  return str;
}

/**
 * Extract slug from a URL path
 * @param {string} path - The URL path (e.g., "/articles/my-article-title")
 * @returns {string} The slug portion
 */
export function extractSlugFromPath(path) {
  // Remove leading/trailing slashes and get the last segment
  const segments = path.replace(/^\/+|\/+$/g, '').split('/');
  return segments[segments.length - 1] || '';
}
