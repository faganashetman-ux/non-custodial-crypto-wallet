'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Wallet, ChevronDown } from 'lucide-react'
import { BottomSheet } from './bottom-sheet'
import { useWallet } from './wallet-provider'
import { useToast } from './toast'
import { NETWORKS } from '@/lib/networks'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const GAS_RESERVE: Record<string, number> = { bsc: 0.0005, eth: 0.005, tron: 5, ton: 0.05 }

export function SendSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { network, accountIndex, setAccountIndex, totalAccounts, address, balances, estimateFee, send, refresh, accountNames } = useWallet()
  const toast = useToast()
  const { t } = useI18n()
  const cfg = NETWORKS[network]

  const [asset, setAsset] = useState<'usdt' | 'native'>('usdt')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState<string | null>(null)
  
  const [isEstimating, setIsEstimating] = useState(false)
  const [sending, setSending] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const available = asset === 'usdt' ? balances?.usdt ?? '0.00' : balances?.native ?? '0.0000'
  const symbol = asset === 'usdt' ? 'USDT' : cfg.nativeSymbol
  const currentAccountName = accountNames[network]?.[accountIndex] || `${t.dashboard.accountLabel} #${accountIndex + 1}`

  const reset = () => { setRecipient(''); setAmount(''); setFee(null) }
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
    if (!amount.trim() || parseFloat(amount) <= 0) { setFee(null); return }
    setIsEstimating(true)
    
    timer.current = setTimeout(async () => {
      try {
        const targetAddress = recipient.trim() || address
        const f = await estimateFee(asset, targetAddress, amount.trim())
        setFee(f)
      } catch { setFee('error') } 
      finally { setIsEstimating(false) }
    }, 700)
  }, [amount, asset, recipient, address, estimateFee])

  const confirm = async () => {
    if (sending) return
    if (!recipient.trim() || !amount.trim() || parseFloat(amount) <= 0) return toast(t.send.errAmount, 'error')
    setSending(true)
    try {
      await send(asset, recipient.trim(), amount.trim())
      toast(`${symbol} ${t.send.successSend}`, 'success')
      close(); refresh()
    } catch { toast(t.send.errSend, 'error') } 
    finally { setSending(false) }
  }

  return (
    <BottomSheet open={open} onClose={close} title={t.send.title}>
      {/* ИСПРАВЛЕНО: Добавлен контейнер с max-h, overflow-y-auto и отступом pb-8 */}
      <div className="flex max-h-[80vh] flex-col gap-5 overflow-y-auto pb-8 pt-2 hide-scrollbar">
        
        {/* Инфо о счете отправителя */}
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

        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(['usdt', 'native'] as const).map((a) => {
              const active = a === asset
              const sym = a === 'usdt' ? 'USDT' : cfg.nativeSymbol
              const imgUrl = a === 'usdt' ? '/tether.png' : cfg.logoUrl

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

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t.send.recipient}</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x... / T..." spellCheck={false} className="w-full rounded-2xl border border-input bg-background p-4 font-mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" />
        </div>

        <div className="min-h-[24px]">
          {isEstimating ? (
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t.send.estimating}</p>
          ) : fee ? (
            <p className={cn('text-center text-sm font-medium transition-opacity', fee === 'error' ? 'text-destructive' : 'text-primary')}>{fee === 'error' ? t.send.feeError : `${t.send.feePrefix} ${fee}`}</p>
          ) : null}
        </div>

        <button onClick={confirm} disabled={sending || !amount || parseFloat(amount) <= 0} className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed">
          {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {sending ? t.send.btnSending : t.send.btnConfirm}
        </button>

      </div>
    </BottomSheet>
  )
}