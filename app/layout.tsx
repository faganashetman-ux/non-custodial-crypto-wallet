import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "XIPHER - See everything. Stay invisible.",
  description: "Premium non-custodial Web3 wallet. Cross-chain swaps, zero borders.",
  manifest: "/manifest.json", // <-- ПОДКЛЮЧИЛИ МАНИФЕСТ
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "XIPHER - See everything. Stay invisible.",
    description: "Premium non-custodial Web3 wallet.",
    images: ['/logo.png'],
  }
}

// Запрещаем зум на мобилках и красим статус-бар телефона
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f0f13' },
    { media: '(prefers-color-scheme: light)', color: '#f2f2f7' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/tronweb@4.4.0/dist/TronWeb.min.js"></script>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}