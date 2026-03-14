import Link from 'next/link'

export default function PortfolioNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-6">
      <h1 className="font-serif text-4xl text-foreground">Artist not found</h1>
      <p className="mt-4 max-w-md text-muted-text">
        This portfolio page doesn&apos;t exist or the artist may have changed their URL.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-muted-text transition-colors hover:text-foreground"
      >
        &larr; Browse the gallery
      </Link>
    </div>
  )
}
