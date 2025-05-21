/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static export
  },
  // Ensure your repository name is included in the path prefix if deploying to GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/bcard-privy-one' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/bcard-privy-one/' : '',
}

module.exports = nextConfig;
