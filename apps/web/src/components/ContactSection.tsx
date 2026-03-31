import { Globe, MapPin, CircleCheck, CircleX } from 'lucide-react'

/** Instagram icon — removed from lucide-react v1.0 (brand icons dropped). */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}
import { cn } from '@/lib/utils'
import { ContactArtistDialog } from '@/components/ContactArtistDialog'

export type ContactSectionProps = {
  hasContactForm: boolean
  artistSlug: string
  artistName: string
  websiteUrl: string | null
  instagramUrl: string | null
  location: string
  commissionsOpen: boolean
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '')
}

function extractInstagramHandle(url: string): string {
  const match = url.match(/instagram\.com\/([^/?]+)/)
  return match ? `@${match[1]}` : url
}

export function ContactSection({
  hasContactForm,
  artistSlug,
  artistName,
  websiteUrl,
  instagramUrl,
  location,
  commissionsOpen,
}: ContactSectionProps) {
  return (
    <section
      data-testid="artist-contact"
      className="rounded-lg border border-border bg-surface px-6 py-8"
    >
      <h2 className="mb-6 font-heading text-2xl text-foreground">
        Get in Touch
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {hasContactForm && (
          <ContactArtistDialog
            artistSlug={artistSlug}
            artistName={artistName}
          />
        )}

        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground transition-colors hover:text-accent-primary"
          >
            <Globe className="size-4 shrink-0 text-muted-text" />
            <span className="text-sm">{stripProtocol(websiteUrl)}</span>
          </a>
        )}

        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground transition-colors hover:text-accent-primary"
          >
            <InstagramIcon className="size-4 shrink-0 text-muted-text" />
            <span className="text-sm">{extractInstagramHandle(instagramUrl)}</span>
          </a>
        )}

        <div className="flex items-center gap-3">
          <MapPin className="size-4 shrink-0 text-muted-text" />
          <span className="text-sm text-foreground">{location}</span>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
            commissionsOpen
              ? 'bg-success/10 text-success'
              : 'bg-muted text-muted-text'
          )}
        >
          {commissionsOpen ? (
            <>
              <CircleCheck className="size-3.5" />
              Open for commissions
            </>
          ) : (
            <>
              <CircleX className="size-3.5" />
              Not taking commissions
            </>
          )}
        </div>
      </div>
    </section>
  )
}
