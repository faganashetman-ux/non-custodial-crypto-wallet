'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePostHog } from 'posthog-js/react' // <-- ИМПОРТ POSTHOG
import { NETWORKS, type NetworkId } from '@/lib/networks'
import * as core from '@/lib/wallet-core'

export type WalletStatus = 'loading' | 'setup' | 'locked' | 'unlocked'

interface WalletContextValue {
  status: WalletStatus
  ready: boolean
  seed: string | null // <-- ДОБАВИЛИ СЮДА
  network: NetworkId
  accountIndex: number
  balances: core.Balances | null
  refreshing: boolean
  address: string
  allAddresses: string[]
  
  totalAccounts: Record<NetworkId, number>
  accountNames: Record<NetworkId, Record<number, string>>
  
  addAccount: (name: string) => void
  renameAccount: (index: number, name: string) => void

  setNetwork: (n: NetworkId) => void
  setAccountIndex: (i: number) => void
  createWallet: (seed: string, password: string) => Promise<void>
  unlock: (password: string) => Promise<void>
  lock: () => void
  refresh: () => Promise<void>

  estimateFee: (asset: 'usdt' | 'native', recipient: string, amount: string) => Promise<string>
  send: (asset: 'usdt' | 'native', recipient: string, amount: string) => Promise<void>
  quote: (from: 'usdt' | 'native', amount: string) => Promise<string>
  swap: (from: 'usdt' | 'native', amount: string, onStage?: (s: string) => void) => Promise<void>
  addressForNetwork: (n: NetworkId, index: number) => Promise<string>
}

const WalletCtx = createContext<WalletContextValue | null>(null)

export function useWallet() {
  const ctx = useContext(WalletCtx)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

const LS = {
  seed: 'verdant.encryptedSeed',
  index: 'verdant.accountIndex',
  network: 'verdant.network',
  totalAccounts: 'verdant.totalAccountsMap',
  accountNames: 'verdant.accountNamesMap'
}

const defaultTotal: Record<NetworkId, number> = { bsc: 10, eth: 10, tron: 10, ton: 10 }
const defaultNames: Record<NetworkId, Record<number, string>> = { bsc: {}, eth: {}, tron: {}, ton: {} }

export function WalletProvider({ children }: { children: ReactNode }) {
  const seedRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<WalletStatus>('loading')
  const [network, setNetworkState] = useState<NetworkId>('bsc')
  const [accountIndex, setAccountIndexState] = useState(0)
  const [balances, setBalances] = useState<core.Balances | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [allAddresses, setAllAddresses] = useState<string[]>([])
  
  const [totalAccounts, setTotalAccounts] = useState<Record<NetworkId, number>>(defaultTotal)
  const [accountNames, setAccountNames] = useState<Record<NetworkId, Record<number, string>>>(defaultNames)

  // ПОДКЛЮЧАЕМ ХУК АНАЛИТИКИ
  const posthog = usePostHog()

  useEffect(() => {
    let mounted = true
    core.waitForLibs().then(() => {
      if (!mounted) return
      setReady(true)
      
      const savedTotal = JSON.parse(localStorage.getItem(LS.totalAccounts) || 'null') || defaultTotal
      const savedNames = JSON.parse(localStorage.getItem(LS.accountNames) || 'null') || defaultNames
      const safeTotal = { ...defaultTotal, ...savedTotal }
      const safeNames = { ...defaultNames, ...savedNames }
      
      setTotalAccounts(safeTotal)
      setAccountNames(safeNames)

      const savedNet = (localStorage.getItem(LS.network) || 'bsc') as NetworkId
      const actualNet = NETWORKS[savedNet] ? savedNet : 'bsc'
      setNetworkState(actualNet)

      const savedIndex = parseInt(localStorage.getItem(LS.index) || '0', 10)
      const maxForNet = safeTotal[actualNet]
      setAccountIndexState(Number.isFinite(savedIndex) && savedIndex < maxForNet ? savedIndex : 0)

      setStatus(localStorage.getItem(LS.seed) ? 'locked' : 'setup')
    }).catch(() => { if (mounted) setStatus('setup') })
    return () => { mounted = false }
  }, [])

  const recomputeAddresses = useCallback(async (net: NetworkId, countsObj: Record<NetworkId, number>) => {
    const seed = seedRef.current
    if (!seed) return
    const promises = []
    const count = countsObj[net]
    for (let i = 0; i < count; i++) {
      promises.push(core.addressFor(seed, i, net))
    }
    const list = await Promise.all(promises)
    setAllAddresses(list)
  }, [])

  const doRefresh = useCallback(async (net: NetworkId, index: number) => {
    const seed = seedRef.current
    if (!seed) return
    setRefreshing(true)
    try {
      const b = await core.fetchBalances(net, seed, index)
      setBalances(b)
    } catch { } 
    finally { setRefreshing(false) }
  }, [])

  const afterUnlock = useCallback((seed: string) => {
    seedRef.current = seed
    setStatus('unlocked')
    recomputeAddresses(network, totalAccounts)
    setBalances(null)
    doRefresh(network, accountIndex)
  }, [network, accountIndex, totalAccounts, recomputeAddresses, doRefresh])

  const createWallet = useCallback(async (rawSeed: string, password: string) => {
    const seed = core.normalizeSeed(rawSeed)
    if (!core.isValidMnemonic(seed)) throw new Error('invalid-seed')
    localStorage.setItem(LS.seed, core.encryptSeed(seed, password))
    
    // АНАЛИТИКА: Регистрация нового кошелька
    posthog?.capture('wallet_created')
    
    afterUnlock(seed)
  }, [afterUnlock, posthog])

  const unlock = useCallback(async (password: string) => {
    const cipher = localStorage.getItem(LS.seed)
    if (!cipher) throw new Error('no-wallet')
    const seed = core.decryptSeed(cipher, password)
    
    // АНАЛИТИКА: Разблокировка (Активность)
    posthog?.capture('wallet_unlocked')
    
    afterUnlock(seed)
  }, [afterUnlock, posthog])

  const lock = useCallback(() => {
    seedRef.current = null
    setBalances(null)
    setAllAddresses([])
    setStatus(localStorage.getItem(LS.seed) ? 'locked' : 'setup')
  }, [])

  const setNetwork = useCallback((n: NetworkId) => {
    setNetworkState(n)
    localStorage.setItem(LS.network, n)
    
    let newIdx = accountIndex
    if (accountIndex >= totalAccounts[n]) {
      newIdx = 0
      setAccountIndexState(newIdx)
      localStorage.setItem(LS.index, String(newIdx))
    }
    
    recomputeAddresses(n, totalAccounts)
    setBalances(null)
    doRefresh(n, newIdx)
  }, [accountIndex, totalAccounts, recomputeAddresses, doRefresh])

  const setAccountIndex = useCallback((i: number) => {
    const max = totalAccounts[network]
    const idx = ((i % max) + max) % max
    setAccountIndexState(idx)
    localStorage.setItem(LS.index, String(idx))
    setBalances(null)
    doRefresh(network, idx)
  }, [totalAccounts, network, doRefresh])

  const addAccount = useCallback((name: string) => {
    const netTotal = totalAccounts[network]
    const newTotalObj = { ...totalAccounts, [network]: netTotal + 1 }
    const newNamesObj = { ...accountNames, [network]: { ...(accountNames[network] || {}), [netTotal]: name } }
    
    setTotalAccounts(newTotalObj)
    setAccountNames(newNamesObj)
    localStorage.setItem(LS.totalAccounts, JSON.stringify(newTotalObj))
    localStorage.setItem(LS.accountNames, JSON.stringify(newNamesObj))
    
    recomputeAddresses(network, newTotalObj)
    setAccountIndexState(netTotal)
    localStorage.setItem(LS.index, String(netTotal))
    setBalances(null)
    doRefresh(network, netTotal)
  }, [totalAccounts, accountNames, network, recomputeAddresses, doRefresh])

  const renameAccount = useCallback((index: number, name: string) => {
    const newNamesObj = { ...accountNames, [network]: { ...(accountNames[network] || {}), [index]: name } }
    setAccountNames(newNamesObj)
    localStorage.setItem(LS.accountNames, JSON.stringify(newNamesObj))
  }, [accountNames, network])

  const refresh = useCallback(() => doRefresh(network, accountIndex), [network, accountIndex, doRefresh])
  const address = useMemo(() => allAddresses[accountIndex] ?? '', [allAddresses, accountIndex])

  const estimateFee = useCallback((asset: 'usdt' | 'native', recipient: string, amount: string) => core.estimateFee(network, seedRef.current!, accountIndex, asset, recipient, amount), [network, accountIndex])
  
  // АНАЛИТИКА: Отправка транзакции
  const send = useCallback(async (asset: 'usdt' | 'native', recipient: string, amount: string) => {
    await core.sendTransaction(network, seedRef.current!, accountIndex, asset, recipient, amount)
    posthog?.capture('transaction_sent', { network, asset })
  }, [network, accountIndex, posthog])
  
  const quote = useCallback((from: 'usdt' | 'native', amount: string) => core.getSwapQuote(network, seedRef.current!, accountIndex, from, amount), [network, accountIndex])
  
  // АНАЛИТИКА: Выполнение обмена
  const swap = useCallback(async (from: 'usdt' | 'native', amount: string, onStage?: (s: string) => void) => {
    await core.executeSwap(network, seedRef.current!, accountIndex, from, amount, onStage)
    posthog?.capture('swap_executed', { network, from_asset: from })
  }, [network, accountIndex, posthog])
  
  const addressForNetwork = useCallback(async (n: NetworkId, index: number) => {
    const seed = seedRef.current
    if (!seed) return ''
    return await core.addressFor(seed, index, n)
  }, [])

  return (
    <WalletCtx.Provider value={{
      status, ready, seed: seedRef.current, network, accountIndex, balances, refreshing, address, allAddresses, // <-- ДОБАВИЛИ СЮДА seed: seedRef.current
      totalAccounts, accountNames, addAccount, renameAccount,
      setNetwork, setAccountIndex, createWallet, unlock, lock, refresh, estimateFee, send, quote, swap, addressForNetwork
    }}>
      {children}
    </WalletCtx.Provider>
  )
}