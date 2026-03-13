'use client'

import { useState, useCallback } from 'react'
import { Share2, Check } from 'lucide-react'

type ShareButtonProps = {
  url: string
  title: string
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    // Use native share API on mobile when available
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — no-op
    }
  }, [url, title])

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? 'Link copied' : 'Share this page'}
      data-testid="share-button"
      className="flex items-center gap-1.5 text-sm text-muted-text transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Share</span>
        </>
      )}
    </button>
  )
}
