import {
  NETWORKS,
  USDT_ABI,
  ROUTER_ABI,
  TRON_API_KEY,
  ETHERSCAN_API_KEY,
  MORALIS_API_KEY, // <-- ИМПОРТ НОВОГО КЛЮЧА MORALIS
  type NetworkId,
} from './networks'
// @ts-ignore
import TonWeb from 'tonweb'

export function libsReady(): boolean {
  return typeof window !== 'undefined' && !!window.ethers && !!window.CryptoJS && !!window.TronWeb
}

export function waitForLibs(timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (libsReady()) return resolve()
    const start = Date.now()
    const iv = setInterval(() => {
      if (libsReady()) {
        clearInterval(iv)
        resolve()
      } else if (Date.now() - start > timeout) {
        clearInterval(iv)
        reject(new Error('Web3 libraries failed to load'))
      }
    }, 80)
  })
}

const E = () => window.ethers
const CJS = () => window.CryptoJS

// === ХЕЛПЕР ДЛЯ ПРОКСИ ===
function getAbsoluteUrl(url: string): string {
  if (typeof window === 'undefined') return url
  return url.startsWith('/') ? window.location.origin + url : url
}

export function generateMnemonic(): string {
  return E().Wallet.createRandom().mnemonic.phrase
}

export function normalizeSeed(seed: string): string {
  return seed.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isValidMnemonic(seed: string): boolean {
  try {
    E().HDNodeWallet.fromPhrase(normalizeSeed(seed))
    return true
  } catch {
    return false
  }
}

export function encryptSeed(seed: string, password: string): string {
  return CJS().AES.encrypt(seed, password).toString()
}

export function decryptSeed(cipher: string, password: string): string {
  const seed = CJS().AES.decrypt(cipher, password).toString(CJS().enc.Utf8)
  if (!seed) throw new Error('bad password')
  return seed
}

export function evmPrivateKey(seed: string, index: number): string {
  return E().HDNodeWallet.fromPhrase(seed, '', `m/44'/60'/0'/0/${index}`).privateKey
}

export function tronPrivateKey(seed: string, index: number): string {
  return E().HDNodeWallet.fromPhrase(seed, '', `m/44'/195'/0'/0/${index}`).privateKey.replace('0x', '')
}

export function evmAddress(seed: string, index: number): string {
  return E().HDNodeWallet.fromPhrase(seed, '', `m/44'/60'/0'/0/${index}`).address
}

export function tronAddress(seed: string, index: number): string {
  return window.TronWeb.address.fromPrivateKey(tronPrivateKey(seed, index))
}

export async function tonAddress(seed: string, index: number): Promise<string> {
  const evmNode = E().HDNodeWallet.fromPhrase(seed, '', `m/44'/607'/0'/0/${index}`)
  const privateKeyHex = evmNode.privateKey.slice(2)
  const seedBytes = new Uint8Array(privateKeyHex.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))
  const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seedBytes)
  
  const tonweb = new TonWeb()
  const WalletClass = tonweb.wallet.all.v4R2
  const wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey, wc: 0 })
  const address = await wallet.getAddress()
  return address.toString(true, true, false)
}

export async function addressFor(seed: string, index: number, network: NetworkId): Promise<string> {
  if (network === 'ton') return await tonAddress(seed, index)
  if (network === 'tron') return tronAddress(seed, index)
  return evmAddress(seed, index)
}

function evmContext(network: NetworkId, seed: string, index: number) {
  const cfg = NETWORKS[network]
  const provider = new (E().JsonRpcProvider)(getAbsoluteUrl(cfg.rpc))
  const wallet = new (E().Wallet)(evmPrivateKey(seed, index), provider)
  const usdt = new (E().Contract)(cfg.usdtAddress, USDT_ABI, wallet)
  return { cfg, provider, wallet, usdt }
}

function tronContext(seed: string, index: number) {
  const cfg = NETWORKS['tron']
  return new window.TronWeb({
    fullHost: getAbsoluteUrl(cfg.rpc),
    privateKey: tronPrivateKey(seed, index),
    headers: { 'TRON-PRO-API-KEY': TRON_API_KEY },
  })
}

const priceCache = new Map<string, { v: number; t: number }>()

export async function getPrice(symbol: string): Promise<number> {
  const cached = priceCache.get(symbol)
  if (cached && Date.now() - cached.t < 20000) return cached.v
  try {
    const res = await fetch(getAbsoluteUrl(`/proxy/api/binance/api/v3/ticker/price?symbol=${symbol}USDT`))
    const price = parseFloat((await res.json()).price)
    priceCache.set(symbol, { v: price, t: Date.now() })
    return price
  } catch { return cached?.v ?? 0 }
}

export interface Balances {
  usdt: string
  native: string
  nativePrice: number
  totalUsd: number
}

export async function fetchBalances(network: NetworkId, seed: string, index: number): Promise<Balances> {
  const cfg = NETWORKS[network]
  let usdt = '0.00'
  let native = '0.0000'

  if (network === 'ton') {
    const addr = await tonAddress(seed, index)
    try {
      const [resNative, resToken] = await Promise.all([
        fetch(getAbsoluteUrl(`/proxy/api/tonapi/v2/accounts/${addr}`)),
        fetch(getAbsoluteUrl(`/proxy/api/tonapi/v2/accounts/${addr}/jettons/${cfg.usdtAddress}`))
      ])
      const nativeData = await resNative.json()
      native = (parseInt(nativeData.balance || '0') / 1e9).toFixed(4)
      
      const tokenData = await resToken.json()
      usdt = (parseInt(tokenData.balance || '0') / 1e6).toFixed(2)
    } catch (e) { console.error("TON Balance Error", e) }
  } 
  else if (network === 'tron') {
    const tron = tronContext(seed, index)
    const base58 = tron.defaultAddress.base58
    const contract = await tron.contract().at(cfg.usdtAddress)
    const balSun = await contract.balanceOf(base58).call()
    const trxSun = await tron.trx.getBalance(base58)
    usdt = (parseInt(balSun.toString()) / 1e6).toFixed(2)
    native = (trxSun / 1e6).toFixed(2)
  } else {
    const { provider, wallet, usdt: contract } = evmContext(network, seed, index)
    const balWei = await contract.balanceOf(wallet.address)
    const nativeWei = await provider.getBalance(wallet.address)
    usdt = parseFloat(E().formatUnits(balWei, cfg.usdtDecimals)).toFixed(2)
    native = parseFloat(E().formatEther(nativeWei)).toFixed(4)
  }

  const nativePrice = await getPrice(cfg.binancePriceSymbol)
  const totalUsd = parseFloat(usdt) + parseFloat(native) * nativePrice
  return { usdt, native, nativePrice, totalUsd }
}

export async function estimateFee(network: NetworkId, seed: string, index: number, asset: 'usdt' | 'native', recipient: string, amount: string): Promise<string> {
  const cfg = NETWORKS[network]
  
  if (network === 'tron') {
    const trx = asset === 'usdt' ? 27.3 : 1.1
    const price = await getPrice('TRX')
    return `~${trx} TRX ($${(trx * price).toFixed(2)})`
  }
  
  if (network === 'ton') {
    const tonGas = asset === 'usdt' ? 0.05 : 0.005
    const price = await getPrice('TON')
    return `~${tonGas} TON ($${(tonGas * price).toFixed(2)})`
  }

  const { provider, usdt } = evmContext(network, seed, index)
  let gasPrice = BigInt(0), gas = BigInt(0)
  
  try {
    const feeData = await provider.getFeeData()
    gasPrice = feeData.gasPrice || feeData.maxFeePerGas || E().parseUnits('30', 'gwei')
  } catch { gasPrice = E().parseUnits(network === 'eth' ? '30' : '3', 'gwei') }

  try {
    gas = asset === 'usdt' ? await usdt.transfer.estimateGas(recipient, E().parseUnits(amount, cfg.usdtDecimals)) : await provider.estimateGas({ to: recipient, value: E().parseEther(amount) })
  } catch { gas = asset === 'usdt' ? BigInt(65000) : BigInt(21000) }

  const feeNative = parseFloat(E().formatEther(gas * gasPrice))
  const price = await getPrice(cfg.binancePriceSymbol)
  return `~${feeNative.toFixed(5)} ${cfg.nativeSymbol} ($${(feeNative * price).toFixed(2)})`
}

export async function sendTransaction(network: NetworkId, seed: string, index: number, asset: 'usdt' | 'native', recipient: string, amount: string): Promise<void> {
  const cfg = NETWORKS[network]
  
  if (network === 'ton') {
    const evmNode = E().HDNodeWallet.fromPhrase(seed, '', `m/44'/607'/0'/0/${index}`)
    const seedBytes = new Uint8Array(evmNode.privateKey.slice(2).match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seedBytes)
    const tonweb = new TonWeb(new TonWeb.HttpProvider(getAbsoluteUrl(cfg.rpc)))
    const wallet = new tonweb.wallet.all.v4R2(tonweb.provider, { publicKey: keyPair.publicKey, wc: 0 })
    const seqno = (await wallet.methods.seqno().call()) || 0

    if (asset === 'native') {
      await wallet.methods.transfer({ secretKey: keyPair.secretKey, toAddress: recipient, amount: TonWeb.utils.toNano(amount), seqno, payload: 'Sent from XIPHER', sendMode: 3 }).send()
    } else {
      const senderAddressStr = await tonAddress(seed, index)
      const resWallet = await fetch(getAbsoluteUrl(`/proxy/api/tonapi/v2/accounts/${senderAddressStr}/jettons/${cfg.usdtAddress}`))
      const jettonData = await resWallet.json()
      if (!jettonData || !jettonData.wallet_address) throw new Error("No USDT balance")
      
      const userJettonWallet = jettonData.wallet_address.address
      const jettonWalletContract = new TonWeb.token.jetton.JettonWallet(tonweb.provider, { address: userJettonWallet })
      const amountUnits = new TonWeb.utils.BN(Math.floor(parseFloat(amount) * 1e6))

      // @ts-ignore
      const payload = await jettonWalletContract.createTransferBody({
          tokenAmount: amountUnits,
          toAddress: new TonWeb.utils.Address(recipient),
          forwardAmount: TonWeb.utils.toNano('0.01'),
          forwardPayload: new Uint8Array([0,0,0,0]),
          responseAddress: new TonWeb.utils.Address(senderAddressStr)
      })

      await wallet.methods.transfer({ secretKey: keyPair.secretKey, toAddress: userJettonWallet, amount: TonWeb.utils.toNano('0.05'), seqno, payload, sendMode: 3 }).send()
    }
    return
  }

  if (network === 'tron') {
    const tron = tronContext(seed, index)
    if (asset === 'usdt') {
      const contract = await tron.contract().at(cfg.usdtAddress)
      await contract.transfer(recipient, Math.floor(parseFloat(amount) * 1e6)).send()
    } else {
      await tron.trx.sendTransaction(recipient, Math.floor(parseFloat(amount) * 1e6))
    }
    return
  }

  const { wallet, usdt } = evmContext(network, seed, index)
  if (asset === 'usdt') {
    await (await usdt.transfer(recipient, E().parseUnits(amount, cfg.usdtDecimals))).wait()
  } else {
    await (await wallet.sendTransaction({ to: recipient, value: E().parseEther(amount) })).wait()
  }
}

// === ИСТОРИЯ ===
export interface TxRecord {
  hash: string
  timestamp: number
  type: 'in' | 'out'
  amount: string
  symbol: string
  explorerUrl: string
}

export async function fetchHistory(network: NetworkId, address: string): Promise<TxRecord[]> {
  const cfg = NETWORKS[network]
  let records: TxRecord[] = []
  const addrLower = address.toLowerCase()

  try {
    if (network === 'ton') {
      const resEvents = await fetch(getAbsoluteUrl(`/proxy/api/tonapi/v2/accounts/${address}/events?limit=20`))
      if (!resEvents.ok) throw new Error('TON API Error')
      const dataEvents = await resEvents.json()
      
      if (dataEvents.events) {
        dataEvents.events.forEach((ev: any) => {
           ev.actions.forEach((act: any) => {
               if (act.type === 'TonTransfer') {
                   const isOut = act.TonTransfer.sender.address === address
                   records.push({ hash: ev.event_id, timestamp: ev.timestamp * 1000, type: isOut ? 'out' : 'in', amount: (act.TonTransfer.amount / 1e9).toFixed(4), symbol: 'TON', explorerUrl: cfg.txExplorer(ev.event_id) })
               } else if (act.type === 'JettonTransfer') {
                   if (act.JettonTransfer.jetton.address === cfg.usdtAddress) {
                       const isOut = act.JettonTransfer.sender?.address === address
                       records.push({ hash: ev.event_id, timestamp: ev.timestamp * 1000, type: isOut ? 'out' : 'in', amount: (act.JettonTransfer.amount / 1e6).toFixed(2), symbol: 'USDT', explorerUrl: cfg.txExplorer(ev.event_id) })
                   }
               }
           })
        })
      }
    } 
    else if (network === 'bsc') {
      // === ПЕРЕЕХАЛИ НА MORALIS API С ЗАЩИТОЙ ОТ ОШИБОК ===
      const options = {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      };

      const [resNative, resToken] = await Promise.all([
        fetch(`https://deep-index.moralis.io/api/v2.2/${address}?chain=bsc&limit=20`, options),
        fetch(`https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers?chain=bsc&contract_addresses=${cfg.usdtAddress}&limit=20`, options)
      ]);

      const dataNative = await resNative.json();
      const dataToken = await resToken.json();

      if (dataNative.result && Array.isArray(dataNative.result)) {
        dataNative.result.forEach((tx: any) => {
          try {
            if (!tx.value || tx.value === '0' || tx.receipt_status === '0') return; 
            
            records.push({
              hash: tx.hash,
              timestamp: new Date(tx.block_timestamp).getTime(),
              type: tx.to_address?.toLowerCase() === addrLower ? 'in' : 'out',
              amount: parseFloat(E().formatEther(tx.value)).toFixed(4),
              symbol: cfg.nativeSymbol,
              explorerUrl: cfg.txExplorer(tx.hash)
            });
          } catch (e) {
            console.warn("Ошибка парсинга BNB транзакции:", e);
          }
        });
      }

      if (dataToken.result && Array.isArray(dataToken.result)) {
        dataToken.result.forEach((tx: any) => {
          try {
            if (!tx.value || tx.value === '0') return;

            records.push({
              hash: tx.transaction_hash,
              timestamp: new Date(tx.block_timestamp).getTime(),
              type: tx.to_address?.toLowerCase() === addrLower ? 'in' : 'out',
              amount: parseFloat(E().formatUnits(tx.value, cfg.usdtDecimals)).toFixed(2), // Берем децималсы из конфига
              symbol: 'USDT',
              explorerUrl: cfg.txExplorer(tx.transaction_hash)
            });
          } catch (e) {
            console.warn("Ошибка парсинга USDT транзакции:", e);
          }
        });
      }
    } 
    else if (network === 'eth') {
      const baseUrl = getAbsoluteUrl(`/proxy/api/etherscan/v2/api?chainid=${cfg.chainId}&address=${address}&page=1&offset=20&sort=desc&apikey=${ETHERSCAN_API_KEY}`)
      const [resNative, resToken] = await Promise.all([
        fetch(`${baseUrl}&module=account&action=txlist`),
        fetch(`${baseUrl}&module=account&action=tokentx&contractaddress=${cfg.usdtAddress}`)
      ])
      const dataNative = await resNative.json()
      const dataToken = await resToken.json()
      
      if (dataNative.status === '1' && Array.isArray(dataNative.result)) {
        dataNative.result.forEach((tx: any) => {
          if (tx.value === '0' || tx.isError === '1') return
          records.push({ hash: tx.hash, timestamp: parseInt(tx.timeStamp) * 1000, type: tx.to.toLowerCase() === addrLower ? 'in' : 'out', amount: parseFloat(E().formatEther(tx.value)).toFixed(4), symbol: cfg.nativeSymbol, explorerUrl: cfg.txExplorer(tx.hash) })
        })
      }
      if (dataToken.status === '1' && Array.isArray(dataToken.result)) {
        dataToken.result.forEach((tx: any) => {
          records.push({ hash: tx.hash, timestamp: parseInt(tx.timeStamp) * 1000, type: tx.to.toLowerCase() === addrLower ? 'in' : 'out', amount: parseFloat(E().formatUnits(tx.value, tx.tokenDecimal)).toFixed(2), symbol: tx.tokenSymbol, explorerUrl: cfg.txExplorer(tx.hash) })
        })
      }
    } else if (network === 'tron') {
      const opts = { headers: { 'TRON-PRO-API-KEY': TRON_API_KEY } }
      const [resToken, resNative] = await Promise.all([
        fetch(getAbsoluteUrl(`/proxy/rpc/tron/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${cfg.usdtAddress}`), opts),
        fetch(getAbsoluteUrl(`/proxy/rpc/tron/v1/accounts/${address}/transactions?limit=20`), opts)
      ])

      const dataToken = await resToken.json()
      if (dataToken.data) {
        dataToken.data.forEach((tx: any) => {
          records.push({ hash: tx.transaction_id, timestamp: tx.block_timestamp, type: tx.to === address ? 'in' : 'out', amount: (parseInt(tx.value) / Math.pow(10, tx.token_info.decimals)).toFixed(2), symbol: tx.token_info.symbol, explorerUrl: cfg.txExplorer(tx.transaction_id) })
        })
      }

      const dataNative = await resNative.json()
      if (dataNative.data) {
        dataNative.data.forEach((tx: any) => {
          if (tx.ret?.[0]?.contractRet !== 'SUCCESS') return
          const contract = tx.raw_data.contract[0]
          if (contract.type === 'TransferContract') {
            const val = contract.parameter.value
            const toAddr = window.TronWeb.address.fromHex(val.to_address)
            records.push({ hash: tx.txID, timestamp: tx.raw_data.timestamp, type: toAddr === address ? 'in' : 'out', amount: (val.amount / 1e6).toFixed(2), symbol: 'TRX', explorerUrl: cfg.txExplorer(tx.txID) })
          }
        })
      }
    }
  } catch (error) {
    console.error("Fetch History Error:", error)
    throw new Error('history-failed')
  }
  
  records.sort((a, b) => b.timestamp - a.timestamp)
  const uniqueRecords = Array.from(new Map(records.map(item => [item.hash, item])).values());
  return uniqueRecords.slice(0, 30)
}

export async function getSwapQuote(network: NetworkId, seed: string, index: number, from: 'usdt' | 'native', amount: string): Promise<string> {
  if (!amount || parseFloat(amount) <= 0) return ''
  const cfg = NETWORKS[network]
  if (network === 'bsc') {
    const provider = new (E().JsonRpcProvider)(getAbsoluteUrl(cfg.rpc))
    const router = new (E().Contract)(cfg.router, ROUTER_ABI, provider)
    const path = from === 'usdt' ? [cfg.usdtAddress, cfg.wrappedNative] : [cfg.wrappedNative, cfg.usdtAddress]
    const amountIn = from === 'usdt' ? E().parseUnits(amount, 18) : E().parseEther(amount)
    const out = await router.getAmountsOut(amountIn, path)
    return from === 'usdt' ? parseFloat(E().formatEther(out[1])).toFixed(5) : parseFloat(E().formatUnits(out[1], 18)).toFixed(2)
  }
  if (network === 'tron') {
    const router = await tronContext(seed, index).contract().at(cfg.router)
    const path = from === 'usdt' ? [cfg.usdtAddress, cfg.wrappedNative] : [cfg.wrappedNative, cfg.usdtAddress]
    const out = await router.getAmountsOut(E().parseUnits(amount, 6).toString(), path).call()
    const raw = out.amounts ? out.amounts[1].toString() : out[1].toString()
    return (Number(raw) / 1e6).toFixed(6)
  }
  throw new Error('unsupported')
}

export async function executeSwap(network: NetworkId, seed: string, index: number, from: 'usdt' | 'native', amount: string, onStage?: (stage: string) => void): Promise<void> {
  const cfg = NETWORKS[network]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20
  
  if (network === 'bsc') {
    const { wallet, usdt } = evmContext(network, seed, index)
    const router = new (E().Contract)(cfg.router, ROUTER_ABI, wallet)
    if (from === 'usdt') {
      const amountIn = E().parseUnits(amount, 18)
      if (await usdt.allowance(wallet.address, cfg.router) < amountIn) {
        onStage?.('approve')
        await (await usdt.approve(cfg.router, E().MaxUint256)).wait()
      }
      onStage?.('swap')
      await (await router.swapExactTokensForETH(amountIn, 0, [cfg.usdtAddress, cfg.wrappedNative], wallet.address, deadline)).wait()
    } else {
      onStage?.('swap')
      await (await router.swapExactETHForTokens(0, [cfg.wrappedNative, cfg.usdtAddress], wallet.address, deadline, { value: E().parseEther(amount) })).wait()
    }
    return
  }

  if (network === 'tron') {
    const tron = tronContext(seed, index)
    const router = await tron.contract().at(cfg.router)
    const usdt = await tron.contract().at(cfg.usdtAddress)
    const base58 = tron.defaultAddress.base58
    const amountIn = E().parseUnits(amount, 6).toString()
    const MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

    if (from === 'usdt') {
      const allowance = await usdt.allowance(base58, cfg.router).call()
      const allowanceStr = allowance.remaining ? allowance.remaining.toString() : allowance.toString()
      if (BigInt(allowanceStr) < BigInt(amountIn)) {
        onStage?.('approve')
        await usdt.approve(cfg.router, MAX).send({ feeLimit: 150000000 })
        await new Promise((r) => setTimeout(r, 4000))
      }
      onStage?.('swap')
      await router.swapExactTokensForETH(amountIn, 0, [cfg.usdtAddress, cfg.wrappedNative], base58, deadline).send({ feeLimit: 150000000 })
    } else {
      onStage?.('swap')
      await router.swapExactETHForTokens(0, [cfg.wrappedNative, cfg.usdtAddress], base58, deadline).send({ callValue: amountIn, feeLimit: 150000000 })
    }
    return
  }

  throw new Error('unsupported')
}