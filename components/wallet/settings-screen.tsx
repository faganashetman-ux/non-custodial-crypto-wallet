'use client'

import { PushToggleSwitch } from './push-toggle-switch'
import { useState } from 'react'
import { Globe, Palette, ShieldAlert, LockKeyhole, Heart } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useWallet } from './wallet-provider'
import { ThemeToggle } from './theme-toggle'
import { LanguageToggle } from './language-toggle'
import { DonateSheet } from './donate-sheet' 

export function SettingsScreen() {
  const { t } = useI18n()
  
  // === ДОСТАЕМ SEED ИЗ ХУКА К КОШЕЛЬКУ ===
  const { lock, seed } = useWallet() 
  
  const [donateOpen, setDonateOpen] = useState(false) 

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col pb-24">
      <header className="flex items-center p-4">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.settingsScreen.title}</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 lg:px-6">
        
        {/* БЛОК: ДОНАТЫ */}
        <section>
          <h2 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t.donate.title}
          </h2>
          <div className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden">
            <button 
              onClick={() => setDonateOpen(true)}
              className="flex w-full items-center justify-between p-4 transition hover:bg-muted/50 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-red-500/10 text-red-500">
                  <Heart className="size-5 fill-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.donate.btnDonate}</p>
                  <p className="text-xs text-muted-foreground">{t.donate.desc}</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* БЛОК: Внешний вид и Язык */}
        <section>
          <h2 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t.settingsScreen.preferences}
          </h2>
          <div className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Globe className="size-5" />
                </div>
                <span className="font-semibold">{t.settingsScreen.language}</span>
              </div>
              <LanguageToggle />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Palette className="size-5" />
                </div>
                <span className="font-semibold">{t.settingsScreen.theme}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* БЛОК: Безопасность и Уведомления */}
        <section>
          <h2 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t.settingsScreen.security}
          </h2>
          <div className="flex flex-col rounded-3xl border border-border bg-card overflow-hidden">
            
            {/* === НАШ НОВЫЙ ТУМБЛЕР ПУШЕЙ === */}
            <div className="border-b border-border/50 px-4 py-1">
              <PushToggleSwitch seed={seed || ''} />
            </div>
            {/* ============================== */}

            <button 
              onClick={lock}
              className="flex w-full items-center justify-between p-4 transition hover:bg-muted/50 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-destructive">{t.settingsScreen.lockWallet}</p>
                  <p className="text-xs text-muted-foreground">{t.settingsScreen.lockDesc}</p>
                </div>
              </div>
              <LockKeyhole className="size-5 text-muted-foreground" />
            </button>
          </div>
        </section>

      </div>

      {/* Вызов шторки */}
      <DonateSheet open={donateOpen} onClose={() => setDonateOpen(false)} />
    </main>
  )
}