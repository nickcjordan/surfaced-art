import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'

export function PortfolioFooter() {
  return (
    <footer data-testid="portfolio-footer" className="border-t border-border mt-auto py-8">
      <Link
        href="/"
        className="flex items-center justify-center gap-1.5 text-xs tracking-wide text-muted-text transition-colors hover:text-foreground"
      >
        <BrandLogo size="sm" />
        <span>Surfaced Art</span>
      </Link>
    </footer>
  )
}
