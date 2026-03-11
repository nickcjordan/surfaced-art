import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@surfaced-art/utils'
import type { ListingStatusType, CategoryType } from '@surfaced-art/types'

// Most portrait ratio allowed (height = 1.5x width) — clamps extreme portrait artwork
const MIN_RATIO = 2 / 3

type ListingCardProps = {
  listing: {
    id: string
    title: string
    medium: string
    category: CategoryType
    price: number
    status: ListingStatusType
    primaryImageUrl: string | null
    primaryImageWidth?: number | null
    primaryImageHeight?: number | null
  }
  artistName: string
  variant?: 'browse' | 'profile' | 'studio'
  className?: string
}

export function ListingCard({
  listing,
  artistName,
  variant = 'browse',
  className,
}: ListingCardProps) {
  const isSold = listing.status === 'sold'
  const href = `/listing/${listing.id}`

  // Use natural aspect ratio if dimensions are known, fall back to square.
  // Clamp extreme portrait ratios to 2:3 (w:h) so tall narrow artwork
  // doesn't blow out masonry columns.
  const hasNaturalRatio = listing.primaryImageWidth && listing.primaryImageHeight
  let aspectStyle: { aspectRatio: string } | undefined
  if (hasNaturalRatio) {
    const naturalRatio = listing.primaryImageWidth! / listing.primaryImageHeight!
    if (naturalRatio < MIN_RATIO) {
      aspectStyle = { aspectRatio: '2 / 3' }
    } else {
      aspectStyle = { aspectRatio: `${listing.primaryImageWidth} / ${listing.primaryImageHeight}` }
    }
  }
  const aspectClass = hasNaturalRatio ? '' : 'aspect-square'

  return (
    <Link
      href={href}
      data-testid="listing-card"
      className={cn(
        'group block rounded-md bg-surface transition-[box-shadow,transform] duration-250 ease-in-out hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      {/* Image container */}
      <div
        className={cn('relative overflow-hidden rounded-t-md', aspectClass)}
        style={aspectStyle}
      >
        {listing.primaryImageUrl ? (
          <Image
            src={listing.primaryImageUrl}
            alt={listing.title}
            fill
            unoptimized
            className={cn(
              'object-cover rounded-sm transition-transform duration-300 ease-in-out',
              (variant === 'profile' || variant === 'studio') && 'group-hover:scale-[1.02]'
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-border">
            <span className="text-muted-text text-sm">No image</span>
          </div>
        )}

        {/* Sold indicator dot */}
        {isSold && (
          <div className="absolute top-2 right-2 size-2.5 rounded-full bg-error" />
        )}

        {/* Browse variant: hover overlay */}
        {variant === 'browse' && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[rgba(26,26,26,0.7)] to-transparent p-4 pt-12 transition-transform duration-300 ease-in-out group-hover:translate-y-0">
            <p className="font-serif text-sm text-white truncate">
              {listing.title}
            </p>
            <p className="text-xs text-white/80 truncate">{artistName}</p>
            <p className="text-sm font-semibold text-white mt-1">
              {formatCurrency(listing.price)}
            </p>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3">
        <h3 className="font-serif text-foreground text-sm truncate">
          {listing.title}
        </h3>
        {variant !== 'studio' && (
          <>
            <p className="text-muted-text text-sm truncate">
              {artistName}
            </p>
            <p className="text-muted-text text-xs truncate">{listing.medium}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(listing.price)}
              </span>
              {isSold && (
                <span className="text-muted-text text-xs font-medium">Sold</span>
              )}
            </div>
          </>
        )}
        {variant === 'studio' && isSold && (
          <span className="text-muted-text text-xs font-medium">Sold</span>
        )}
      </div>
    </Link>
  )
}
