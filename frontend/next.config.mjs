/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Set the output file tracing root to fix workspace detection
  outputFileTracingRoot: process.cwd(),

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://fra.cloud.appwrite.io https://*.appwrite.io wss://fra.cloud.appwrite.io wss://*.appwrite.io http://45.55.174.40:8000 https://45.55.174.40:8000 http://localhost:* https://localhost:*",
              "frame-src 'self' https://fra.cloud.appwrite.io https://*.appwrite.io",
              "manifest-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

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






