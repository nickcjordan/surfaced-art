'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PostHogProvider } from 'posthog-js/react'
import {
  POSTHOG_KEY,
  POSTHOG_OPTIONS,
  getStoredConsent,
  grantConsent,
  denyConsent,
  type ConsentStatus,
} from './analytics'

export interface ConsentContextValue {
  consentStatus: ConsentStatus
  acceptAnalytics: () => void
  declineAnalytics: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

interface ConsentProviderProps {
  children: ReactNode
}

/**
 * Manages GDPR cookie consent state for PostHog analytics.
 * Pair with PostHogProvider from posthog-js/react which handles initialization.
 */
export function ConsentProvider({ children }: ConsentProviderProps) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(getStoredConsent)

  // Sync PostHog opt-in/opt-out state with stored consent on mount
  useEffect(() => {
    if (consentStatus === 'granted') {
      grantConsent()
    } else if (consentStatus === 'denied') {
      denyConsent()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- only run on mount to restore consent

  const acceptAnalytics = useMemo(
    () => () => {
      grantConsent()
      setConsentStatus('granted')
    },
    [],
  )

  const declineAnalytics = useMemo(
    () => () => {
      denyConsent()
      setConsentStatus('denied')
    },
    [],
  )

  const value = useMemo<ConsentContextValue>(
    () => ({
      consentStatus,
      acceptAnalytics,
      declineAnalytics,
    }),
    [consentStatus, acceptAnalytics, declineAnalytics],
  )

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  )
}

export function useAnalyticsConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    throw new Error(
      'useAnalyticsConsent must be used within a ConsentProvider',
    )
  }
  return ctx
}

/**
 * Combined client-side analytics wrapper for use in the server component layout.
 * Wraps PostHogProvider (initialization) + ConsentProvider (GDPR consent state).
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) {
    return <ConsentProvider>{children}</ConsentProvider>
  }

  return (
    <PostHogProvider apiKey={POSTHOG_KEY} options={POSTHOG_OPTIONS}>
      <ConsentProvider>{children}</ConsentProvider>
    </PostHogProvider>
  )
}
