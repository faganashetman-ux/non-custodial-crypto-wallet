export type NetworkId = 'bsc' | 'eth' | 'tron' | 'ton'

export interface NetworkConfig {
  id: NetworkId
  chainId?: number
  name: string
  shortName: string
  nativeSymbol: string
  nativeName: string
  usdtSymbol: string
  usdtDecimals: number
  binancePriceSymbol: string 
  rpc: string
  usdtAddress: string
  router: string
  wrappedNative: string
  explorer: (address: string) => string
  txExplorer: (hash: string) => string
  nativeColor: string
  logoUrl: string
}

export const USDT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

export const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
]

export const ETHERSCAN_API_KEY = '7YUFEQXZ9A1CPXNWW56F5YG7B6IQN16FV1'
export const TRON_API_KEY = '4172ec39-66f8-4b8e-b9d4-80d2eea26654'
// === ТВОЙ КЛЮЧ ОТ NODEREAL ===
export const NODEREAL_API_KEY = 'bfbc83023e1c494f97a332db16a6e562'

const SUNSWAP_ROUTER = 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax'
const WTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR'
const USDT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  bsc: {
    id: 'bsc', chainId: 56, name: 'BNB Smart Chain', shortName: 'BSC', nativeSymbol: 'BNB', nativeName: 'BNB', usdtSymbol: 'USDT', usdtDecimals: 18, binancePriceSymbol: 'BNB', 
    rpc: '/proxy/rpc/bsc', 
    usdtAddress: '0x55d398326f99059fF775485246999027B3197955', router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', wrappedNative: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', explorer: (a) => `https://bscscan.com/address/${a}`, txExplorer: (h) => `https://bscscan.com/tx/${h}`, nativeColor: '#f0b90b', logoUrl: '/bnb.png'
  },
  eth: {
    id: 'eth', chainId: 1, name: 'Ethereum', shortName: 'ETH', nativeSymbol: 'ETH', nativeName: 'Ethereum', usdtSymbol: 'USDT', usdtDecimals: 6, binancePriceSymbol: 'ETH', 
    rpc: '/proxy/rpc/eth', 
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', wrappedNative: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', explorer: (a) => `https://etherscan.io/address/${a}`, txExplorer: (h) => `https://etherscan.io/tx/${h}`, nativeColor: '#627eea', logoUrl: '/eth.png'
  },
  tron: {
    id: 'tron', name: 'Tron', shortName: 'TRON', nativeSymbol: 'TRX', nativeName: 'Tron', usdtSymbol: 'USDT', usdtDecimals: 6, binancePriceSymbol: 'TRX', 
    rpc: '/proxy/rpc/tron', 
    usdtAddress: USDT_TRON, router: SUNSWAP_ROUTER, wrappedNative: WTRX, explorer: (a) => `https://tronscan.org/#/address/${a}`, txExplorer: (h) => `https://tronscan.org/#/transaction/${h}`, nativeColor: '#ef0027', logoUrl: '/tron.png'
  },
  ton: {
    id: 'ton', name: 'The Open Network', shortName: 'TON', nativeSymbol: 'TON', nativeName: 'Toncoin', usdtSymbol: 'USDT', usdtDecimals: 6, binancePriceSymbol: 'TON', 
    rpc: '/proxy/rpc/ton', 
    usdtAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', router: '', wrappedNative: '', explorer: (a) => `https://tonscan.org/address/${a}`, txExplorer: (h) => `https://tonscan.org/tx/${h}`, nativeColor: '#0098EA', logoUrl: '/ton.png'
  }
}

export const NETWORK_ORDER: NetworkId[] = ['tron', 'bsc', 'ton', 'eth']
export const ACCOUNT_COUNT = 10