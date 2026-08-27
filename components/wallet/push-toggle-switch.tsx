'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { useToast } from './toast' // <-- ПРОВЕРЬ ЭТОТ ПУТЬ!
import { checkPushStatus, subscribeToPushes, unsubscribeFromPushes } from '@/lib/push'
import { cn } from '@/lib/utils'

export function PushToggleSwitch({ seed }: { seed: string }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const toast = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      checkPushStatus().then(status => setIsEnabled(status))
    } else {
      setIsSupported(false)
    }
  }, [])

  const handleToggle = async () => {
    if (!seed) return // Теперь проверяем наличие сидки
    setIsLoading(true)

    try {
      if (isEnabled) {
        // Юзер выключает пуши (адрес больше не нужен, удаляем по токену)
        const success = await unsubscribeFromPushes()
        if (success) {
          setIsEnabled(false)
          toast('Уведомления отключены', 'success')
        }
      } else {
        // Юзер включает пуши (передаем seed для генерации 40 адресов)
        const success = await subscribeToPushes(seed)
        if (success) {
          setIsEnabled(true)
          toast('Уведомления включены!', 'success')
        } else {
          toast('Ошибка. Возможно, вы запретили пуши в настройках ОС', 'error')
        }
      }
    } catch (e) {
      toast('Что-то пошло не так', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between py-3 opacity-50">
        <div className="flex items-center gap-3">
          <Bell className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium">Push-уведомления</span>
        </div>
        <span className="text-xs text-muted-foreground">Не поддерживается</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full transition-colors", isEnabled ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")}>
          <Bell className="size-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Уведомления</p>
          <p className="text-xs text-muted-foreground">О входящих переводах</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          isEnabled ? "bg-primary" : "bg-input",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Loader2 className="size-3 animate-spin text-primary-foreground/70" />
          </span>
        )}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
            isEnabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  )
}