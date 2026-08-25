'use client'

import { useI18n } from '@/lib/i18n'

export function LanguageToggle() {
  const { lang, setLang } = useI18n()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
      aria-label="Toggle language"
      className="grid h-10 px-3 place-items-center rounded-full border border-border bg-card text-xs font-bold uppercase text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
    >
      {lang}
    </button>
  )
}