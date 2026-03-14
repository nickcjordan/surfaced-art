'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type PortfolioNavProps = {
  slug: string
  hasCv: boolean
}

export function PortfolioNav({ slug, hasCv }: PortfolioNavProps) {
  const pathname = usePathname()
  const base = `/${slug}`

  const links = [
    { href: base, label: 'Work' },
    { href: `${base}/about`, label: 'About' },
    ...(hasCv ? [{ href: `${base}/cv`, label: 'CV' }] : []),
  ]

  return (
    <nav data-testid="portfolio-nav" className="mx-auto max-w-6xl px-6">
      <div className="flex gap-6 border-b border-border">
        {links.map((link) => {
          const isActive =
            link.href === base
              ? pathname === base
              : pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'pb-3 text-sm tracking-wide transition-colors',
                isActive
                  ? 'border-b-2 border-current font-medium text-foreground'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
