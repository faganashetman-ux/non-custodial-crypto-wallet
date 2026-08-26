'use client'

import { cn } from '@/lib/utils'

interface CoinIconProps {
  symbol?: string
  src?: string // Добавили поддержку прямой ссылки
  size?: number
  className?: string
}

export function CoinIcon({ symbol, src, size = 24, className }: CoinIconProps) {
  const sym = symbol?.toUpperCase() || ''

  // Словарь для автоматического подтягивания твоих локальных иконок
  const LOCAL_ICONS: Record<string, string> = {
    USDT: '/tether.png',
    BNB: '/bnb.png',
    BSC: '/bnb.png',
    ETH: '/eth.png',
    TRX: '/tron.png',
    TRON: '/tron.png',
    TON: '/ton.png',
  }

  const finalSrc = src || LOCAL_ICONS[sym]

  if (finalSrc) {
    return (
      <img 
        src={finalSrc} 
        alt={sym} 
        className={cn("flex shrink-0 items-center justify-center rounded-full object-cover shadow-sm", className)} 
        style={{ width: size, height: size }}
      />
    )
  }

  // Заглушка
  return (
    <div 
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/30", className)} 
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] font-bold">{sym.slice(0, 3)}</span>
    </div>
  )
}