'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: number
  message: string
  type: ToastType
}

const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(
  () => {},
)

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-3 sm:items-end sm:p-5">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-lg shadow-black/5 animate-in slide-in-from-top-2 fade-in"
          >
            {t.type === 'success' && (
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
            )}
            {t.type === 'error' && (
              <XCircle className="size-5 shrink-0 text-destructive" />
            )}
            {t.type === 'info' && (
              <Info className="size-5 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 text-pretty leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
