/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Set the output file tracing root to fix workspace detection
  outputFileTracingRoot: process.cwd(),
 
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://45.55.174.40:8000/:path*', // Proxy to DigitalOcean Backend
      },
    ];
  },
};

export default nextConfig;






