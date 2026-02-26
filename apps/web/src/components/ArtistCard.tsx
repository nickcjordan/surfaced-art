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
    coverImageUrl: string | null
    categories: CategoryType[]
  }
  className?: string
  'data-testid'?: string
}

export function ArtistCard({ artist, className, 'data-testid': testId }: ArtistCardProps) {
  return (
    <Link
      href={`/artist/${artist.slug}`}
      data-testid={testId}
      className={cn(
        'group block rounded-md bg-surface overflow-hidden transition-[box-shadow,transform] duration-250 ease-in-out hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      {/* Cover image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {artist.coverImageUrl ? (
          <Image
            src={artist.coverImageUrl}
            alt={`${artist.displayName} cover image`}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="size-full bg-border" />
        )}
      </div>

      {/* Content area */}
      <div className="relative px-4 pb-4 pt-8">
        {/* Profile photo overlapping cover */}
        <div className="absolute -top-6 left-4">
          <ProfilePhoto
            src={artist.profileImageUrl}
            alt={artist.displayName}
            size="md"
            bordered
          />
        </div>

        <h3 className="font-serif text-foreground text-base mt-2 truncate">
          {artist.displayName}
        </h3>
        <p className="text-muted-text text-sm truncate">{artist.location}</p>

        {/* Category badges */}
        {artist.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {artist.categories.slice(0, 3).map((category) => (
              <Badge key={category}>
                {categoryLabels[category] ?? category}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
