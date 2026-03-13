import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { ShareButton } from './ShareButton'
import { SITE_URL } from '@/lib/site-config'

type StudioTopBarProps = {
  artistName: string
  artistSlug: string
}

export function StudioTopBar({ artistName, artistSlug }: StudioTopBarProps) {
  return (
    <header data-testid="studio-top-bar" className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-14">
        <span className="font-serif text-foreground tracking-wide text-base truncate">
          {artistName}
        </span>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <ShareButton
            url={`${SITE_URL}/${artistSlug}`}
            title={`${artistName} — Surfaced Art`}
          />
          <Link
            href={`/artist/${artistSlug}`}
            className="flex items-center gap-1.5 text-sm text-muted-text transition-colors hover:text-foreground"
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Shop on Surfaced Art</span>
            <span className="sm:hidden sr-only">Shop on Surfaced Art</span>
            <span className="sm:hidden" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
