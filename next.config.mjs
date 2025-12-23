/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/results',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd105g9g8xzllmy.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
