import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Verdant · Web3 Wallet',
    short_name: 'Verdant',
    description:
      'Non-custodial multi-chain wallet for BSC, Ethereum and Tron.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4faf6',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
