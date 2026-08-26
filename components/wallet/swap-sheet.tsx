'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Loader2, Repeat } from 'lucide-react'
import { BottomSheet } from './bottom-sheet'
import { useWallet } from './wallet-provider'
import { useToast } from './toast'
import { NETWORKS } from '@/lib/networks'
import { CoinIcon } from './coin-icon'
import { useI18n, type Dictionary } from '@/lib/i18n'

const GAS_RESERVE: Record<string, number> = { bsc: 0.002, eth: 0.01, tron: 15, ton: 0.1 }

export function SwapSheet({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { network, balances, quote, swap, refresh } = useWallet()
  const toast = useToast()
  const { t } = useI18n()
  const cfg = NETWORKS[network]

  const [from, setFrom] = useState<'usdt' | 'native'>('usdt')
  const [amountFrom, setAmountFrom] = useState('')
  const [amountTo, setAmountTo] = useState('')
  const [quoting, setQuoting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<string>('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Блокируем свопы для Эфира и Тона
  const swapDisabled = network === 'eth' || network === 'ton'
  
  const nativeSym = cfg.nativeSymbol
  const fromSym = from === 'usdt' ? 'USDT' : nativeSym
  const toSym = from === 'usdt' ? nativeSym : 'USDT'
  const fromBal = from === 'usdt' ? balances?.usdt ?? '0' : balances?.native ?? '0'
  const toBal = from === 'usdt' ? balances?.native ?? '0' : balances?.usdt ?? '0'

  const close = () => { setAmountFrom(''); setAmountTo(''); onClose() }

  const runQuote = (value: string) => {
    if (timer.current) clearTimeout(timer.current)
    if (!value || parseFloat(value) <= 0 || swapDisabled) return setAmountTo('')
    setQuoting(true)
    timer.current = setTimeout(async () => {
      try {
        const out = await quote(from, value)
        setAmountTo(out)
      } catch {
        setAmountTo('')
        toast(t.swap.errNoRoute, 'error')
      } finally { setQuoting(false) }
    }, 700)
  }

  useEffect(() => { if (amountFrom) runQuote(amountFrom) }, [from])

  const setMax = () => {
    if (from === 'usdt') {
      setAmountFrom(balances?.usdt ?? '0')
      runQuote(balances?.usdt ?? '0')
    } else {
      const max = parseFloat(balances?.native ?? '0') - (GAS_RESERVE[network] ?? 0)
      if (max <= 0) return toast(t.swap.errGas, 'error')
      const v = max.toFixed(network === 'tron' ? 2 : 4)
      setAmountFrom(v)
      runQuote(v)
    }
  }

  const reverse = () => {
    setFrom((f) => (f === 'usdt' ? 'native' : 'usdt'))
    setAmountFrom(amountTo && amountTo !== 'error' ? amountTo : '')
    setAmountTo('')
  }

  const execute = async () => {
    if (busy) return
    if (swapDisabled) return toast(`Swaps are disabled on ${cfg.name}.`, 'error')
    if (!amountFrom || parseFloat(amountFrom) <= 0) return toast(t.swap.errAmount, 'error')
    setBusy(true)
    try {
      await swap(from, amountFrom, (s) => setStage(s))
      toast(t.swap.successSwap, 'success')
      close(); refresh()
    } catch { toast(t.swap.errSwap, 'error') } 
    finally { setBusy(false); setStage('') }
  }

  const btnLabel = busy ? (stage === 'approve' ? t.swap.btnApproving : t.swap.btnSwapping) : t.swap.btnSwap

  return (
    <BottomSheet open={open} onClose={close} title={t.swap.title}>
      {swapDisabled && (
        <p className="mb-4 rounded-2xl bg-muted px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
          Swaps on {cfg.name} are disabled. Switch to BSC or Tron to swap.
        </p>
      )}

      <div className="relative flex flex-col gap-2">
        <SwapBox label={t.swap.youPay} symbol={fromSym} balance={fromBal} value={amountFrom} onChange={(v) => { setAmountFrom(v); runQuote(v) }} onMax={setMax} t={t} />
        <div className="relative z-10 -my-4 flex justify-center">
          <button onClick={reverse} className="grid size-10 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow transition hover:rotate-180"><ArrowUpDown className="size-4" /></button>
        </div>
        <SwapBox label={t.swap.youReceive} symbol={toSym} balance={toBal} value={quoting ? '' : amountTo} placeholder={quoting ? t.swap.calcPlaceholder : '0.0'} readOnly t={t} />
      </div>

      <button onClick={execute} disabled={busy || swapDisabled} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Repeat className="size-5" />}
        {btnLabel}
      </button>
    </BottomSheet>
  )
}

interface SwapBoxProps {
  label: string
  symbol: string
  balance: string
  value: string
  onChange?: (v: string) => void
  onMax?: () => void
  readOnly?: boolean
  placeholder?: string
  t: Dictionary
}

function SwapBox({ label, symbol, balance, value, onChange, onMax, readOnly, placeholder = '0.0', t }: SwapBoxProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">{t.common.balance}: {balance} {symbol}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground"><CoinIcon symbol={symbol} size={20} />{symbol}</div>
        <input type="number" inputMode="decimal" value={value} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-right text-2xl font-bold outline-none placeholder:text-muted-foreground/60" />
        {onMax && <button onClick={onMax} className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground">{t.common.max}</button>}
      </div>
    </div>
  )
}