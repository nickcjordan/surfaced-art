import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'

/**
 * Global site footer with platform statement, category links,
 * social media placeholders, and copyright.
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gallery-border bg-gallery-bg mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:grid-cols-4">
          {/* Platform statement */}
          <div className="md:col-span-1 lg:col-span-1">
            <p className="font-serif text-xl tracking-tight text-gallery-foreground mb-4">
              Surfaced Art
            </p>
            <p className="text-sm leading-relaxed text-gallery-muted max-w-xs">
              A curated digital gallery for real makers. Every artist is
              vetted. Every piece is handmade. No dropshipping, no AI art,
              no mass production.
            </p>
          </div>

          {/* Category links */}
          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="text-xs font-medium uppercase tracking-widest text-gallery-foreground mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={category.href}
                    className="text-sm text-gallery-muted transition-colors hover:text-gallery-foreground"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform links placeholder */}
          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="text-xs font-medium uppercase tracking-widest text-gallery-foreground mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gallery-muted transition-colors hover:text-gallery-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/artists"
                  className="text-sm text-gallery-muted transition-colors hover:text-gallery-foreground"
                >
                  Artists
                </Link>
              </li>
            </ul>
          </div>

          {/* Social media placeholders */}
          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="text-xs font-medium uppercase tracking-widest text-gallery-foreground mb-4">
              Follow
            </h3>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-gallery-muted/60">
                  Instagram
                </span>
              </li>
              <li>
                <span className="text-sm text-gallery-muted/60">
                  Pinterest
                </span>
              </li>
              <li>
                <span className="text-sm text-gallery-muted/60">
                  Newsletter
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 border-t border-gallery-border pt-8">
          <p className="text-xs text-gallery-muted/60 text-center">
            &copy; {currentYear} Surfaced Art. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
