import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", 
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  async rewrites() {
    return [
      { source: '/proxy/rpc/bsc', destination: 'https://bsc-dataseed.binance.org/' },
      { source: '/proxy/rpc/eth', destination: 'https://ethereum-rpc.publicnode.com' },
      { source: '/proxy/rpc/tron/:path*', destination: 'https://api.trongrid.io/:path*' },
      { source: '/proxy/rpc/ton/:path*', destination: 'https://toncenter.com/api/v2/jsonRPC/:path*' },
      { source: '/proxy/api/binance/:path*', destination: 'https://api.binance.com/:path*' },
      { source: '/proxy/api/etherscan/:path*', destination: 'https://api.etherscan.io/:path*' },
      { source: '/proxy/api/tonapi/:path*', destination: 'https://tonapi.io/:path*' },
      // === НОВЫЙ БЕСПЛАТНЫЙ СКАНЕР ДЛЯ BSC ===
      { source: '/proxy/api/blockscout-bsc', destination: 'https://bsc.blockscout.com/api' }
    ]
  },
}

export default withPWA(nextConfig);