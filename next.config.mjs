import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  // Отключаем кэширование PWA, когда ты кодишь у себя на компе, чтобы не мешало
  disable: process.env.NODE_ENV === "development", 
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/proxy/rpc/bsc', destination: 'https://bsc-dataseed.binance.org/' },
      { source: '/proxy/rpc/eth', destination: 'https://eth.drpc.org' },
      { source: '/proxy/rpc/tron/:path*', destination: 'https://api.trongrid.io/:path*' },
      { source: '/proxy/rpc/ton/:path*', destination: 'https://toncenter.com/api/v2/jsonRPC/:path*' },
      { source: '/proxy/api/binance/:path*', destination: 'https://api.binance.com/:path*' },
      { source: '/proxy/api/etherscan/:path*', destination: 'https://api.etherscan.io/:path*' },
      { source: '/proxy/api/tonapi/:path*', destination: 'https://tonapi.io/:path*' }
    ]
  },
}

export default withPWA(nextConfig);