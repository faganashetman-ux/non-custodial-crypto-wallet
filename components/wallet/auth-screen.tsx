'use client'

import { useState } from 'react'
import { Sparkles, Lock, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useWallet } from './wallet-provider'
import { useToast } from './toast'
import { ThemeToggle } from './theme-toggle'
import { LanguageToggle } from './language-toggle'
import { useI18n } from '@/lib/i18n'
import { generateMnemonic } from '@/lib/wallet-core'
import { cn } from '@/lib/utils'

export function AuthScreen() {
  const { status, createWallet, unlock } = useWallet()
  const toast = useToast()
  const { t } = useI18n()

  const [seed, setSeed] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)

  const isSetup = status === 'setup'

  const handleGenerate = () => {
    try {
      setSeed(generateMnemonic())
      toast('New recovery phrase generated!', 'success')
    } catch {
      toast('Could not generate phrase. Try again.', 'error')
    }
  }

  const handleSetup = async () => {
    if (busy) return
    if (!seed.trim() || !password) {
      toast('Enter a 12-word phrase and a master password.', 'error')
      return
    }
    setBusy(true)
    try {
      await createWallet(seed, password)
      toast('Wallet secured. Welcome to XIPHER!', 'success') // Обновили имя в уведомлении
    } catch (e: any) {
      toast(e?.message === 'invalid-seed' ? 'Invalid recovery phrase.' : 'Something went wrong.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleUnlock = async () => {
    if (busy) return
    if (!password) {
      toast('Enter your master password.', 'error')
      return
    }
    setBusy(true)
    try {
      await unlock(password)
      setPassword('')
    } catch {
      toast('Wrong password.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleReset = () => {
    localStorage.removeItem('verdant.encryptedSeed')
    localStorage.removeItem('verdant.accountIndex')
    window.location.reload()
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      
      <header className="relative z-10 flex items-center justify-between p-4">
        {/* === ЛОГОТИП СЛЕВА ВВЕРХУ === */}
        <div className="flex items-center gap-2 font-bold tracking-tight uppercase text-lg">
          <img src="/logo.png" alt="XIPHER" className="size-8 rounded-full object-cover bg-card shadow-sm border border-border" />
          XIPHER
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            
            {/* === ЛОГОТИП ПО ЦЕНТРУ (ВМЕСТО ЩИТА) === */}
            <div className="mx-auto mb-5 size-20 rounded-full border-2 border-primary/20 bg-card shadow-[0_0_30px_rgba(132,204,22,0.15)] overflow-hidden p-1">
              <img src="/logo.png" alt="XIPHER Logo" className="size-full rounded-full object-cover" />
            </div>

            <h1 className="text-balance text-3xl font-extrabold tracking-tight uppercase">
              {isSetup ? t.auth.setupTitle : t.auth.welcomeBack}
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              {isSetup ? t.auth.setupDesc : t.auth.unlockDesc}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            {isSetup ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t.auth.phraseLabel}</label>
                  <textarea
                    value={seed} onChange={(e) => setSeed(e.target.value)} rows={3} placeholder="apple banana cherry ..." spellCheck={false}
                    className="w-full resize-none rounded-2xl border border-input bg-background p-4 font-mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <button onClick={handleGenerate} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition hover:border-primary/40 hover:text-primary active:scale-[0.98]">
                  <Sparkles className="size-4" /> {t.auth.generatePhrase}
                </button>
                <PasswordField value={password} onChange={setPassword} show={showPw} toggleShow={() => setShowPw((s) => !s)} placeholder={t.auth.pwCreatePlaceholder} onEnter={handleSetup} />
                <PrimaryButton onClick={handleSetup} busy={busy}>
                  <Lock className="size-5" /> {t.auth.encryptBtn}
                </PrimaryButton>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <PasswordField value={password} onChange={setPassword} show={showPw} toggleShow={() => setShowPw((s) => !s)} placeholder={t.auth.pwPlaceholder} onEnter={handleUnlock} autoFocus />
                <PrimaryButton onClick={handleUnlock} busy={busy}>
                  <KeyRound className="size-5" /> {t.auth.unlockBtn}
                </PrimaryButton>
                <button onClick={handleReset} className="mx-auto text-xs font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline">
                  {t.auth.resetBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function PasswordField({ value, onChange, show, toggleShow, placeholder, onEnter, autoFocus }: any) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) onEnter() }}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-input bg-background p-4 pr-12 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
      />
      <button type="button" onClick={toggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition hover:text-foreground">
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}

function PrimaryButton({ onClick, busy, children }: any) {
  return (
    <button onClick={onClick} disabled={busy} className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70">
      {busy ? <Loader2 className="size-5 animate-spin" /> : children}
    </button>
  )
}