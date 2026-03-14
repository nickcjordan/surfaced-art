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

      {/* Header skeleton — name + location */}
      <div className="mx-auto max-w-6xl px-6 pt-8 pb-4">
        <div className="h-10 w-64 animate-skeleton rounded bg-surface sm:h-12" />
        <div className="mt-2 h-4 w-28 animate-skeleton rounded bg-surface" />
      </div>

      {/* Nav tab skeleton */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex gap-6 border-b border-border pb-3">
          <div className="h-4 w-12 animate-skeleton rounded bg-surface" />
          <div className="h-4 w-14 animate-skeleton rounded bg-surface" />
          <div className="h-4 w-8 animate-skeleton rounded bg-surface" />
        </div>
      </div>

      {/* Work grid skeleton */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] animate-skeleton rounded-md bg-surface" />
              <div className="h-4 w-3/4 animate-skeleton rounded bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
