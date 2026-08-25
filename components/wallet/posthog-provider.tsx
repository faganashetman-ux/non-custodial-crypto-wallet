'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Хардкодим публичные ключи (это абсолютно безопасно для клиентской аналитики)
    posthog.init('phc_rNZF27uWAy89R4hRAudh9vpcxQZAEwRCkivvvwJwdbCQ', {
      api_host: 'https://us.i.posthog.com', // <-- ИСПРАВЛЕНО: Правильный сервер для US Cloud
      person_profiles: 'identified_only', 
      capture_pageview: false, 
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}