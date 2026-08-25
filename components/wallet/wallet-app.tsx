'use client'

import { PHProvider } from './posthog-provider' // <-- ДОБАВИЛИ ИМПОРТ
import { useState } from 'react'
import { Loader2, Wallet, Clock, Settings } from 'lucide-react'
import { ToastProvider } from './toast'
import { WalletProvider, useWallet } from './wallet-provider'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { AuthScreen } from './auth-screen'
import { Dashboard } from './dashboard'
import { HistoryScreen } from './history-screen'
import { SettingsScreen } from './settings-screen' // <-- НОВЫЙ ИМПОРТ
import { cn } from '@/lib/utils'

function AppShell() {
  const { status } = useWallet()
  const { t } = useI18n()
  // Добавили 'settings' в стейт вкладок
  const [tab, setTab] = useState<'wallet' | 'history' | 'settings'>('wallet')

  if (status === 'loading') {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm font-medium">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  if (status === 'setup' || status === 'locked') {
    return <AuthScreen />
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div className="flex-1 pb-24">
        {/* Рендерим экраны в зависимости от вкладки */}
        {tab === 'wallet' && <Dashboard />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-20 items-center justify-center gap-8 sm:gap-16 border-t border-border bg-background/80 px-6 pb-safe backdrop-blur-xl">
        <button 
          onClick={() => setTab('wallet')} 
          className={cn("flex flex-col items-center gap-1.5 transition-colors", tab === 'wallet' ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
        >
          <Wallet className={cn("size-6 transition-transform", tab === 'wallet' && "scale-110")} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t.tabs.wallet}</span>
        </button>

        <button 
          onClick={() => setTab('history')} 
          className={cn("flex flex-col items-center gap-1.5 transition-colors", tab === 'history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
        >
          <Clock className={cn("size-6 transition-transform", tab === 'history' && "scale-110")} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t.tabs.history}</span>
        </button>

        {/* НОВАЯ КНОПКА: Настройки */}
        <button 
          onClick={() => setTab('settings')} 
          className={cn("flex flex-col items-center gap-1.5 transition-colors", tab === 'settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
        >
          <Settings className={cn("size-6 transition-transform", tab === 'settings' && "scale-110")} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t.tabs.settings}</span>
        </button>
      </nav>
    </div>
  )
}

export function WalletApp() {
  return (
    <PHProvider> {/* <-- ОБЕРНУЛИ В АНАЛИТИКУ */}
      <I18nProvider>
        <ToastProvider>
          <WalletProvider>
            <AppShell />
          </WalletProvider>
        </ToastProvider>
      </I18nProvider>
    </PHProvider>
  )
}