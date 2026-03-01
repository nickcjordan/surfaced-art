'use client'

import { useAnalyticsConsent } from '@/lib/analytics'
import { Button } from '@/components/ui/button'

export function CookieConsent() {
  const { consentStatus, acceptAnalytics, declineAnalytics } =
    useAnalyticsConsent()

  if (consentStatus !== 'pending') return null

  return (
    <div
      data-testid="cookie-consent"
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-6 py-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          We use cookies to understand how visitors interact with this gallery.
          No personal data is sold or shared.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={declineAnalytics}
            data-testid="cookie-decline"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={acceptAnalytics}
            data-testid="cookie-accept"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
