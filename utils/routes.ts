/**
 * Utility functions for routing with base path support for GitHub Pages deployment
 */

/**
 * Gets the correct href for a link accounting for basePath in production
 * @param href - The path to format (e.g., '/dashboard')
 * @returns The correctly formatted path with basePath if needed
 */
// export function getRoute(href: string): string {
//   // This check is needed because Next.js handles basePath in Link components automatically,
//   // but we need to handle it manually for other cases (like redirects or non-Next.js links)
//   const basePath = process.env.NODE_ENV === 'production' ? '/bcard-privy-one' : '';
  
//   // If href is external, return it as is
//   if (href.startsWith('http') || href.startsWith('#')) {
//     return href;
//   }
  
//   // Ensure we don't double up the basePath
//   const path = href.startsWith('/') ? href : `/${href}`;
//   return `${basePath}${path}`;
// }

export function getRoute(path: string): string {
  // Make sure path starts with a slash and return only the path
  // Next.js will handle adding the basePath
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Creates absolute URLs for resources that need the full URL (like meta images)
 * @param path - The path to the resource
 * @returns The full URL with domain and basePath
 */
export function getFullUrl(path: string): string {
  const basePath = process.env.NODE_ENV === 'production' ? '/bcard-privy-one' : '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourusername.github.io';
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${basePath}${cleanPath}`;
}
