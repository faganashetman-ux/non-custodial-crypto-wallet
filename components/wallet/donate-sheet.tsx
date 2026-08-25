'use client'

import { useEffect, useRef, useState } from 'react'
// ИСПРАВЛЕНО: Добавлен ChevronDown для стрелочки выбора счета
import { Heart, Loader2, Wallet, Send, ChevronDown } from 'lucide-react'
import { BottomSheet } from './bottom-sheet'
import { useWallet } from './wallet-provider'
import { useToast } from './toast'
import { NETWORKS } from '@/lib/networks'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { usePostHog } from 'posthog-js/react'
import { NetworkSwitcher } from './network-switcher'

const GAS_RESERVE: Record<string, number> = { bsc: 0.0005, eth: 0.005, tron: 5, ton: 0.05 }

// 👇 ВСТАВЬ СЮДА СВОИ РЕАЛЬНЫЕ АДРЕСА ДЛЯ ДОНАТОВ 👇
const MY_DONATION_ADDRESSES: Record<string, string> = {
  bsc: '0x4b1968d3FE315D4741841c658615D948FdfF389D', 
  eth: '0x4b1968d3FE315D4741841c658615D948FdfF389D', 
  tron: 'TMf3dSCj5QFCVeK4wtySo34gwq1z58UZSx',     
  ton: 'UQDGQ57WOXlG6G7TLmL-2sU3Dw_WQlu1ngo8eIpYqFisXvTu'       
}

export function DonateSheet({ open, onClose }: { open: boolean, onClose: () => void }) {
  // Добавили setAccountIndex и totalAccounts
  const { network, accountIndex, setAccountIndex, totalAccounts, balances, estimateFee, send, refresh, accountNames } = useWallet()
  const toast = useToast()
  const { t } = useI18n()
  const posthog = usePostHog()
  const cfg = NETWORKS[network]

  const devAddress = MY_DONATION_ADDRESSES[network] || ''
  
  const [asset, setAsset] = useState<'usdt' | 'native'>('native')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState<string | null>(null)
  
  const [isEstimating, setIsEstimating] = useState(false)
  const [sending, setSending] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const available = asset === 'usdt' ? balances?.usdt ?? '0.00' : balances?.native ?? '0.0000'
  const symbol = asset === 'usdt' ? 'USDT' : cfg.nativeSymbol

  const reset = () => { setAmount(''); setFee(null) }
  const close = () => { reset(); onClose() }

  const setMax = () => {
    if (asset === 'usdt') {
      setAmount(balances?.usdt ?? '0')
    } else {
      const max = parseFloat(balances?.native ?? '0') - (GAS_RESERVE[network] ?? 0)
      if (max <= 0) return toast(t.send.errGas, 'error')
      setAmount(max.toFixed(network === 'tron' ? 2 : 4))
    }
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!amount.trim() || parseFloat(amount) <= 0 || !devAddress) { setFee(null); return }
    setIsEstimating(true)
    
    timer.current = setTimeout(async () => {
      try {
        const f = await estimateFee(asset, devAddress, amount.trim())
        setFee(f)
      } catch { setFee('error') } 
      finally { setIsEstimating(false) }
    }, 700)
  }, [amount, asset, estimateFee, devAddress])

  const confirm = async () => {
    if (sending) return
    if (!amount.trim() || parseFloat(amount) <= 0) return toast(t.send.errAmount, 'error')
    if (!devAddress) return toast('Developer address not set!', 'error')

    setSending(true)
    try {
      await send(asset, devAddress, amount.trim())
      toast(t.donate.thanks, 'success')
      posthog?.capture('donation_sent', { network, asset }) 
      close(); refresh()
    } catch { toast(t.send.errSend, 'error') } 
    finally { setSending(false) }
  }

  return (
    <BottomSheet open={open} onClose={close} title={t.donate.title}>
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col items-center justify-center gap-2 text-center pt-2 pb-2">
          <div className="grid size-14 place-items-center rounded-full bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Heart className="size-7 fill-red-500" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t.donate.thanks}</p>
        </div>

        {/* === ИСПРАВЛЕНО: Интерактивный выбор счета === */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4 shadow-sm relative">
          <div className="flex items-center gap-3 w-full">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="text-xs text-muted-foreground">{t.send.fromAccount}</p>
              <select
                value={accountIndex}
                onChange={(e) => {
                  setAccountIndex(Number(e.target.value))
                  setAmount('')
                  setFee(null)
                }}
                className="w-full appearance-none bg-transparent text-sm font-semibold outline-none truncate pr-6 cursor-pointer"
              >
                {Array.from({ length: totalAccounts[network] || 10 }).map((_, i) => (
                  <option key={i} value={i} className="bg-background text-foreground">
                    {accountNames[network]?.[i] || `${t.dashboard.accountLabel} #${i + 1}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-xs text-muted-foreground">{t.send.gasBalance}</p>
            <p className="font-mono text-sm font-bold text-foreground">
              {balances?.native ?? '0.0000'} {cfg.nativeSymbol}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm flex flex-col gap-3">
          <NetworkSwitcher />
          
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(['usdt', 'native'] as const).map((a) => {
              const active = a === asset
              const sym = a === 'usdt' ? 'USDT' : cfg.nativeSymbol
              const imgUrl = a === 'usdt' ? 'https://cryptologos.cc/logos/tether-usdt-logo.svg' : cfg.logoUrl

              return (
                <button
                  key={a} onClick={() => { setAsset(a); setAmount(''); setFee(null) }}
                  className={cn('flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors', active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                >
                  <img src={imgUrl} alt={sym} className="size-[18px] rounded-full object-cover" />
                  {sym}
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between px-2 text-sm">
            <span className="text-muted-foreground">{t.common.available}:</span>
            <span className="font-mono font-semibold">{available} {symbol}</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t.send.amount}</label>
          <div className="relative">
            <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="w-full rounded-2xl border border-input bg-background p-4 pr-16 text-lg font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" />
            <button onClick={setMax} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground">{t.common.max}</button>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Получатель:</p>
          <p className="font-semibold text-primary">{t.donate.toDev}</p>
        </div>

        <div className="min-h-[24px]">
          {isEstimating ? (
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t.send.estimating}</p>
          ) : fee ? (
            <p className={cn('text-center text-sm font-medium transition-opacity', fee === 'error' ? 'text-destructive' : 'text-primary')}>{fee === 'error' ? t.send.feeError : `${t.send.feePrefix} ${fee}`}</p>
          ) : null}
        </div>

        <button onClick={confirm} disabled={sending || !amount || parseFloat(amount) <= 0} className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-4 text-sm font-bold text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] transition active:scale-[0.98] hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {sending ? t.donate.sending : t.donate.confirm}
        </button>

      </div>
    </BottomSheet>
  )
}