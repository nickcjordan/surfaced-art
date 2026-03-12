import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ProfilePhoto } from './ProfilePhoto'
import { Category } from '@surfaced-art/types'
import type { CategoryType } from '@surfaced-art/types'

const categoryLabels = Object.fromEntries(
  Object.values(Category).map((c) => [
    c,
    c
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  ])
) as Record<CategoryType, string>

type ArtistCardProps = {
  artist: {
    slug: string
    displayName: string
    location: string
    profileImageUrl: string | null
    artworkImageUrls: string[]
    categories: CategoryType[]
  }
  className?: string
  'data-testid'?: string
}

/** Mosaic grid: one tall image on the left, two stacked on the right */
function MosaicGrid({ imgs, artistName }: { imgs: string[]; artistName: string }) {
  if (imgs.length === 0) {
    return <div className="aspect-square bg-border" />
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 bg-border">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image src={imgs[0]} alt={`${artistName} artwork`} fill unoptimized className="object-cover" />
      </div>
      <div className="grid grid-rows-2 gap-0.5">
        {imgs[1] ? (
          <div className="relative overflow-hidden">
            <Image src={imgs[1]} alt={`${artistName} artwork`} fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="bg-border" />
        )}
        {imgs[2] ? (
          <div className="relative overflow-hidden">
            <Image src={imgs[2]} alt={`${artistName} artwork`} fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="bg-border" />
        )}
      </div>
    </div>
  )
}

export function ArtistCard({ artist, className, 'data-testid': testId }: ArtistCardProps) {
  return (
    <Link
      href={`/artist/${artist.slug}`}
      data-testid={testId}
      className={cn(
        'group block rounded-md bg-surface border border-border overflow-hidden transition-[box-shadow,transform] duration-250 ease-in-out hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      {/* Artwork mosaic grid */}
      <MosaicGrid imgs={artist.artworkImageUrls ?? []} artistName={artist.displayName} />

      {/* Artist info — medium inline */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <ProfilePhoto src={artist.profileImageUrl} alt={artist.displayName} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-foreground text-base truncate">{artist.displayName}</h3>
          <p className="text-muted-text text-sm truncate">{artist.location}</p>
        </div>
      </div>
      {artist.categories.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {artist.categories.slice(0, 3).map((category) => (
            <Badge key={category} className="text-xs px-2 py-0.5">
              {categoryLabels[category] ?? category}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  )
}
