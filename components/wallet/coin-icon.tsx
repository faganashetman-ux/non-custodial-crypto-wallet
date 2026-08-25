'use client'

import { cn } from '@/lib/utils'
import { Coins } from 'lucide-react'

interface CoinIconProps {
  symbol?: string
  size?: number
  className?: string
}

export function CoinIcon({ symbol, size = 24, className }: CoinIconProps) {
  const sym = symbol?.toUpperCase() || ''

  // === НАСТОЯЩИЕ ВЕКТОРНЫЕ ЛОГОТИПЫ ===
  const ICONS: Record<string, React.ReactNode> = {
    USDT: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#26A17B"/>
        <path d="M12 14.5c2.76 0 5-1.12 5-2.5s-2.24-2.5-5-2.5-5 1.12-5 2.5 2.24 2.5 5 2.5zm1.5-6.5h3v1.5h-3v4h-1.5v-4h-3V8h3v-.5z" fill="#fff"/>
      </svg>
    ),
    BNB: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#F3BA2F"/>
        <path d="M12 7.5L9.5 10L12 12.5L14.5 10L12 7.5ZM7.5 12L5 14.5L7.5 17L10 14.5L7.5 12ZM16.5 12L14 14.5L16.5 17L19 14.5L16.5 12ZM12 13.5L9.5 16L12 18.5L14.5 16L12 13.5Z" fill="#fff"/>
      </svg>
    ),
    BSC: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#F3BA2F"/>
        <path d="M12 7.5L9.5 10L12 12.5L14.5 10L12 7.5ZM7.5 12L5 14.5L7.5 17L10 14.5L7.5 12ZM16.5 12L14 14.5L16.5 17L19 14.5L16.5 12ZM12 13.5L9.5 16L12 18.5L14.5 16L12 13.5Z" fill="#fff"/>
      </svg>
    ),
    ETH: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#627EEA"/>
        <path d="M11.75 4.5v6.5l5.5-2.5-5.5-4zM11.75 19.5v-7.5l-5.5-3 5.5 10.5zM6.25 10.5l5.5 2.5v-6.5l-5.5 4zM17.25 10.5l-5.5 2.5v6.5l5.5-9z" fill="#fff"/>
      </svg>
    ),
    TRX: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#FF0013"/>
        <path d="M16.5 15.5L12 6L7.5 15.5H16.5Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    TRON: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#FF0013"/>
        <path d="M16.5 15.5L12 6L7.5 15.5H16.5Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    TON: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#0098EA"/>
        <path d="M12 6.5l4.5 8.5L12 17.5 7.5 15l4.5-8.5z" fill="#fff"/>
      </svg>
    ),
  }

  if (ICONS[sym]) {
    return (
      <div 
        className={cn("flex shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm", className)} 
        style={{ width: size, height: size }}
      >
        {ICONS[sym]}
      </div>
    )
  }

  // Заглушка, если монеты нет в списке
  return (
    <div 
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/30", className)} 
      style={{ width: size, height: size }}
    >
      <Coins style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  )
}