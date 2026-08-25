'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, LockKeyhole, Repeat, RefreshCw, Users } from 'lucide-react'
import { useWallet } from './wallet-provider'
import { useI18n } from '@/lib/i18n'
import { NETWORKS } from '@/lib/networks'
import { NetworkSwitcher } from './network-switcher'
import { CoinIcon } from './coin-icon'
import { formatUsd, formatAmount, truncateAddress } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AccountsSheet } from './accounts-sheet'
import { ReceiveSheet } from './receive-sheet'
import { SendSheet } from './send-sheet'
import { SwapSheet } from './swap-sheet'

type Sheet = 'accounts' | 'receive' | 'send' | 'swap' | null

export function Dashboard() {
  const { network, accountIndex, setAccountIndex, address, balances, refreshing, refresh, lock, accountNames } = useWallet()
  const { t } = useI18n()
  const [sheet, setSheet] = useState<Sheet>(null)
  const cfg = NETWORKS[network]

  const usdtUsd = parseFloat(balances?.usdt ?? '0')
  const nativeUsd = parseFloat(balances?.native ?? '0') * (balances?.nativePrice ?? 0)
  
  const currentAccountName = accountNames[network]?.[accountIndex] || `${t.dashboard.accountLabel} #${accountIndex + 1}`

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col">
      <header className="flex items-center gap-3 p-4">
        <div className="flex items-center gap-2 font-bold tracking-tight uppercase text-lg">
          <img src="/logo.png" alt="XIPHER" className="size-8 rounded-full object-cover border border-border shadow-sm" />
          <span className="hidden sm:inline">XIPHER</span>
          <span className="hidden sm:inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400 normal-case tracking-normal">
            v1.0 Beta
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <NetworkSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={lock} aria-label="Lock wallet" className="grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-destructive">
            <LockKeyhole className="size-5" />
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-6 px-4 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 lg:px-6">
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-1">
            <button onClick={() => setAccountIndex(accountIndex - 1)} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronLeft className="size-5" /></button>
            <button onClick={() => setSheet('accounts')} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/40">
              <Users className="size-4 text-primary" /> 
              {currentAccountName}
              <span className="font-mono text-xs text-muted-foreground">{truncateAddress(address, 4, 4)}</span>
            </button>
            <button onClick={() => setAccountIndex(accountIndex + 1)} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronRight className="size-5" /></button>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg shadow-primary/20">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="text-sm font-medium text-primary-foreground/80">{t.dashboard.totalBalance}</span>
              <button onClick={refresh} className="grid size-8 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"><RefreshCw className={cn('size-4', refreshing && 'animate-spin')} /></button>
            </div>
            <p className="relative mt-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">{balances ? formatUsd(balances.totalUsd) : '—'}</p>
            <p className="relative mt-1 text-sm text-primary-foreground/80">on {cfg.name}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ActionButton icon={<ArrowDownLeft className="size-5" />} label={t.dashboard.receive} onClick={() => setSheet('receive')} />
            <ActionButton icon={<ArrowUpRight className="size-5" />} label={t.dashboard.send} onClick={() => setSheet('send')} />
            <ActionButton icon={<Repeat className="size-5" />} label={t.dashboard.swap} onClick={() => setSheet('swap')} />
          </div>
        </section>

        <section className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">{t.dashboard.assets}</h2>
            <a href={cfg.explorer(address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
              {t.dashboard.viewExplorer} <ExternalLink className="size-3.5" />
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {/* === ИСПРАВЛЕНО: Снова используем CoinIcon === */}
            <AssetRow symbol="USDT" name="Tether USD" price="$1.00" amount={balances?.usdt ?? '0.00'} usd={usdtUsd} />
            <AssetRow symbol={cfg.nativeSymbol} name={cfg.nativeName} price={balances ? formatUsd(balances.nativePrice) : 'Loading…'} amount={balances?.native ?? '0.0000'} usd={nativeUsd} />
          </div>
        </section>
      </div>

      <AccountsSheet open={sheet === 'accounts'} onClose={() => setSheet(null)} />
      <ReceiveSheet open={sheet === 'receive'} onClose={() => setSheet(null)} />
      <SendSheet open={sheet === 'send'} onClose={() => setSheet(null)} />
      <SwapSheet open={sheet === 'swap'} onClose={() => setSheet(null)} />
    </main>
  )
}

function ActionButton({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-semibold shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.97]">
      <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">{icon}</span>
      {label}
    </button>
  )
}

function AssetRow({ symbol, name, price, amount, usd }: any) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <CoinIcon symbol={symbol} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">{price}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm font-bold tabular-nums">{formatAmount(amount, 6)}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{formatUsd(usd)}</p>
      </div>
    </div>
  )
}