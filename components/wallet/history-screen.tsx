'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2, ChevronDown } from 'lucide-react'
import { useWallet } from './wallet-provider'
import { useI18n } from '@/lib/i18n'
import { NETWORKS, type NetworkId } from '@/lib/networks'
import { fetchHistory, type TxRecord } from '@/lib/wallet-core'
import { truncateAddress } from '@/lib/format'
import { NetworkSwitcher } from './network-switcher'
import { cn } from '@/lib/utils'

export function HistoryScreen() {
  // Добавили totalAccounts, чтобы не рендерить лишние пустые счета
  const { network, allAddresses, totalAccounts } = useWallet()
  const { t } = useI18n()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  const maxAccounts = totalAccounts[network] || 10

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col pb-24">
      <header className="flex items-center gap-3 p-4">
        <div className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="hidden sm:inline text-xl">{t.history.title}</span>
        </div>
        <div className="min-w-0 flex-1">
          <NetworkSwitcher />
        </div>
      </header>

      <div className="flex-1 px-4 lg:px-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-3 mt-4">
          {allAddresses.slice(0, maxAccounts).map((addr, i) => (
            <AccountHistoryAccordion 
              key={`${network}-${i}`} 
              index={i} 
              address={addr} 
              network={network}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

interface AccordionProps {
  index: number
  address: string
  network: NetworkId
  isOpen: boolean
  onToggle: () => void
}

function AccountHistoryAccordion({ index, address, network, isOpen, onToggle }: AccordionProps) {
  const { t } = useI18n()
  const { accountNames } = useWallet() 
  const [history, setHistory] = useState<TxRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const cfg = NETWORKS[network]

  // === ИСПРАВЛЕНО: Правильное имя для текущей сети ===
  const currentAccountName = accountNames[network]?.[index] || `${t.dashboard.accountLabel} #${index + 1}`

  const handleToggle = async () => {
    onToggle()
    if (!isOpen && !history && !loading) {
      setLoading(true); setError(false)
      try { 
        const data = await fetchHistory(network, address)
        setHistory(data) 
      } 
      catch { setError(true) } 
      finally { setLoading(false) }
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all">
      <button onClick={handleToggle} className="flex w-full items-center justify-between p-4 transition hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">{index + 1}</span>
          <div className="text-left">
            {/* Вставляем имя счета */}
            <p className="text-sm font-semibold">{currentAccountName}</p>
            <p className="font-mono text-xs text-muted-foreground">{truncateAddress(address, 6, 4)}</p>
          </div>
        </div>
        <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="border-t border-border bg-muted/20 p-4">
          {loading && <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t.history.loading}</div>}
          {error && <div className="py-6 text-center text-sm text-destructive">{t.history.error}</div>}
          {!loading && !error && history?.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">{t.history.empty}</div>}
          {!loading && !error && history && history.length > 0 && (
            <div className="flex flex-col gap-3">
              {history.map((tx) => (
                <a key={tx.hash} href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-border/50 bg-background p-3 transition hover:border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className={cn("grid size-8 place-items-center rounded-full", tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}>
                      {tx.type === 'in' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tx.type === 'in' ? t.history.received : t.history.sent}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", tx.type === 'in' ? 'text-green-500' : '')}>
                      {tx.type === 'in' ? '+' : '-'}{tx.amount} {tx.symbol}
                    </p>
                    <ExternalLink className="mt-1 ml-auto size-3 text-muted-foreground" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}