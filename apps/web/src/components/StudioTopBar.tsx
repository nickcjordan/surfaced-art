import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

type StudioTopBarProps = {
  artistName: string
  artistSlug: string
}

export function StudioTopBar({ artistName, artistSlug }: StudioTopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-14">
        <span className="font-serif text-foreground tracking-wide text-base truncate">
          {artistName}
        </span>
        <Link
          href={`/artist/${artistSlug}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground shrink-0 ml-4"
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Shop on Surfaced Art</span>
          <span className="sm:hidden sr-only">Shop on Surfaced Art</span>
          <span className="sm:hidden" aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  )
}
