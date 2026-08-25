'use client'

import { useState, useEffect } from 'react'
import { Check, Copy, ExternalLink, Edit2, Plus, X } from 'lucide-react'
import { BottomSheet } from './bottom-sheet'
import { useWallet } from './wallet-provider'
import { useToast } from './toast'
import { NETWORKS } from '@/lib/networks'
import { truncateAddress } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export function AccountsSheet({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { network, accountIndex, allAddresses, totalAccounts, accountNames, setAccountIndex, addAccount, renameAccount } = useWallet()
  const toast = useToast()
  const { t } = useI18n()
  const cfg = NETWORKS[network]
  const [copied, setCopied] = useState<number | null>(null)
  
  const [dialog, setDialog] = useState<{ isOpen: boolean; mode: 'create' | 'rename'; index?: number; name: string }>({ isOpen: false, mode: 'create', name: '' })

  const maxAccounts = totalAccounts[network] || 10 

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialog.isOpen) {
        e.stopImmediatePropagation()
        e.preventDefault()
        closeDialog()
      }
    }
    if (dialog.isOpen) document.addEventListener('keydown', handleEscape, { capture: true })
    return () => document.removeEventListener('keydown', handleEscape, { capture: true })
  }, [dialog.isOpen])

  const copy = async (addr: string, index: number) => {
    try {
      await navigator.clipboard.writeText(addr); setCopied(index)
      setTimeout(() => setCopied((c) => (c === index ? null : c)), 1500)
      toast(t.accounts.copiedToast, 'success')
    } catch { toast(t.accounts.errCopy, 'error') }
  }

  const select = (index: number) => {
    setAccountIndex(index)
    onClose()
    const name = accountNames[network]?.[index] || `${t.dashboard.accountLabel} #${index + 1}`
    toast(`${t.accounts.switchedToast} ${name}`, 'success')
  }

  const openCreate = () => setDialog({ isOpen: true, mode: 'create', name: '' })
  const openRename = (index: number, currentName: string) => setDialog({ isOpen: true, mode: 'rename', index, name: currentName })
  const closeDialog = () => setDialog({ ...dialog, isOpen: false })

  const submitDialog = () => {
    const trimmed = dialog.name.trim()
    if (!trimmed) return
    if (dialog.mode === 'create') {
      addAccount(trimmed); onClose(); toast('Новый счет создан!', 'success')
    } else if (dialog.mode === 'rename' && dialog.index !== undefined) {
      renameAccount(dialog.index, trimmed)
    }
    closeDialog()
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={t.accounts.title}>
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          <img src={cfg.logoUrl} className="size-6 rounded-full" alt="" />
          <span>
            {maxAccounts} {t.accounts.desc1} <span className="font-semibold text-foreground">{cfg.name}</span>, {t.accounts.desc2}
          </span>
        </div>

        <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar">
          {allAddresses.slice(0, maxAccounts).map((addr, i) => {
            const active = i === accountIndex
            const displayName = accountNames[network]?.[i] || `${t.dashboard.accountLabel} #${i + 1}`
            
            return (
              <li key={`${network}-${i}`}>
                <div className={cn('group flex items-center gap-2 rounded-2xl border p-3 transition-colors', active ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary/40')}>
                  <button onClick={() => select(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold', active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>{i + 1}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {displayName}
                        {active && <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary"><Check className="size-3" /> {t.accounts.active}</span>}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{truncateAddress(addr, 10, 8)}</span>
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center">
                    <button onClick={() => openRename(i, displayName)} title="Переименовать" className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Edit2 className="size-4" /></button>
                    <a href={cfg.explorer(addr)} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"><ExternalLink className="size-4" /></a>
                    <button onClick={() => copy(addr, i)} className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                      {copied === i ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* === ИСПРАВЛЕННАЯ КНОПКА (Стильная таблетка по центру) === */}
        <div className="mt-2 flex justify-center pt-4 pb-2 border-t border-border/50">
          <button 
            onClick={openCreate} 
            className="flex items-center gap-2 rounded-full bg-secondary/80 px-6 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary active:scale-[0.97]"
          >
            <Plus className="size-4" />
            {t.accounts.createNew}
          </button>
        </div>
      </BottomSheet>

      {/* Всплывающая плашка */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">{dialog.mode === 'create' ? t.accounts.createNew : t.accounts.rename}</h3>
              <button onClick={closeDialog} className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"><X className="size-4" /></button>
            </div>
            <input autoFocus value={dialog.name} onChange={(e) => setDialog({ ...dialog, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') submitDialog() }} placeholder={t.accounts.enterName} className="w-full rounded-2xl border border-input bg-background p-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 mb-6" />
            <div className="flex gap-3">
              <button onClick={closeDialog} className="flex-1 rounded-2xl bg-secondary py-3.5 text-sm font-bold text-secondary-foreground transition hover:bg-secondary/80">{t.common.cancel}</button>
              <button onClick={submitDialog} disabled={!dialog.name.trim()} className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed">{dialog.mode === 'create' ? t.accounts.createBtn : t.accounts.saveBtn}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}