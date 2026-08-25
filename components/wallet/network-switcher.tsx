'use client'

import { useWallet } from './wallet-provider'
import { NETWORKS, NETWORK_ORDER } from '@/lib/networks'
import { CoinIcon } from './coin-icon'
import { cn } from '@/lib/utils'

export function NetworkSwitcher() {
  const { network, setNetwork } = useWallet()

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm hide-scrollbar">
      {NETWORK_ORDER.map((netId) => {
        const cfg = NETWORKS[netId]
        const active = network === netId

        return (
          <button
            key={netId}
            onClick={() => setNetwork(netId)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition-all',
              active
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {/* ИСПРАВЛЕНО: Убрали src, оставили только symbol! */}
            <CoinIcon symbol={cfg.shortName} size={20} />
            {cfg.shortName}
          </button>
        )
      })}
    </div>
  )
}