// Ambient declarations for the web3 libraries loaded via <Script> in the layout.
// These mirror the original wallet's CDN-based setup.

declare global {
  interface Window {
    ethers: any
    TronWeb: any
    CryptoJS: any
    QRCode: any
  }
}

export {}
