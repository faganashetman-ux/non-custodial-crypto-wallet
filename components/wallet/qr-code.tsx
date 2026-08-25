'use client'

import QRCode from 'react-qr-code'
import { cn } from '@/lib/utils'

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

export function QrCode({ value, size = 196, className }: QrCodeProps) {
  if (!value) return null

  return (
    <div 
      className={cn(
        "rounded-2xl bg-white p-4 shadow-sm border border-border/50 flex items-center justify-center", 
        className
      )}
    >
      <QRCode
        value={value}
        size={size}
        level="L" // Уровень коррекции ошибок (L отлично подходит для простых адресов)
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  )
}