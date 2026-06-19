/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  
  async rewrites() {
    return [
      { source: '/', destination: '/' },
      { source: '/quiz', destination: '/quiz' },
      { source: '/practice', destination: '/practice' },
      { source: '/contact', destination: '/contact' },
      { source: '/privacy', destination: '/privacy' },
    ];
  },
  
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/index', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
    ];
  }
};

module.exports = nextConfig;
