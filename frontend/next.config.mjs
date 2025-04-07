/** @type {import('next').NextConfig} */
const nextConfig = {
 reactStrictMode: true,
 
 async rewrites() {
   return [
     {
       source: '/api/:path*',
       destination: 'http://167.71.90.100:8000/:path*', // Proxy to Backend using server IP
     },
   ];
 },
};

export default nextConfig;






