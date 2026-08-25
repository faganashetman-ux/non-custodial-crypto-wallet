'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { BottomSheet } from './bottom-sheet'
import { QrCode } from './qr-code'
import { useWallet } from './wallet-provider'
import { useToast } from './toast'
import { NETWORKS } from '@/lib/networks'
import { useI18n } from '@/lib/i18n'

export function ReceiveSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { network, accountIndex, address } = useWallet()
  const toast = useToast()
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const cfg = NETWORKS[network]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast(t.common.copied, 'success')
    } catch {
      toast(t.accounts.errCopy, 'error')
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={t.receive.title}>
      {/* ИСПРАВЛЕНО: Добавлен скролл (overflow-y-auto) и отступ снизу (pb-8) */}
      <div className="flex max-h-[80vh] flex-col items-center gap-4 overflow-y-auto pb-8 pt-2 hide-scrollbar">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {cfg.name} · {t.dashboard.accountLabel} #{accountIndex + 1}
        </span>

        {address ? <QrCode value={address} size={196} /> : null}

        <p className="text-xs text-muted-foreground">{t.receive.yourAddress}</p>
        <div className="w-full break-all rounded-2xl border border-border bg-muted px-4 py-3 text-center font-mono text-sm">
          {address || 'Loading…'}
        </div>

        <button
          onClick={copy}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98] hover:brightness-105"
        >
          {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
          {copied ? t.common.copied : t.common.copyAddress}
        </button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t.receive.warning1} {cfg.name} {t.receive.warning2}
        </p>
      </div>
    </BottomSheet>
  )
}