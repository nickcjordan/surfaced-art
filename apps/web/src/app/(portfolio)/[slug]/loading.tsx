export default function PortfolioLoading() {
  return (
    <div data-testid="portfolio-skeleton">
      {/* Top bar skeleton */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="h-4 w-32 animate-skeleton rounded bg-surface" />
          <div className="h-4 w-24 animate-skeleton rounded bg-surface" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-56 animate-skeleton bg-surface sm:h-72 md:h-96" />

      {/* Profile info skeleton */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative -mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="size-[160px] shrink-0 animate-skeleton rounded-full bg-surface ring-4 ring-background" />
          <div className="flex-1 space-y-3 pb-1">
            <div className="h-8 w-48 animate-skeleton rounded bg-surface" />
            <div className="h-4 w-28 animate-skeleton rounded bg-surface" />
            <div className="flex gap-1.5">
              <div className="h-6 w-16 animate-skeleton rounded-full bg-surface" />
              <div className="h-6 w-20 animate-skeleton rounded-full bg-surface" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-6xl space-y-16 px-6 py-12">
        {/* Bio skeleton */}
        <div className="max-w-2xl space-y-3">
          <div className="h-4 w-full animate-skeleton rounded bg-surface" />
          <div className="h-4 w-full animate-skeleton rounded bg-surface" />
          <div className="h-4 w-3/4 animate-skeleton rounded bg-surface" />
        </div>

        {/* Work section skeleton */}
        <div>
          <div className="mb-6 h-7 w-20 animate-skeleton rounded bg-surface" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[3/4] animate-skeleton rounded-md bg-surface" />
                <div className="h-4 w-3/4 animate-skeleton rounded bg-surface" />
                <div className="h-3 w-1/2 animate-skeleton rounded bg-surface" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
