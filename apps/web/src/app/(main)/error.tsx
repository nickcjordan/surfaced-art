'use client'

import Link from 'next/link'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-semibold text-muted-text">500</p>
      <h1 className="mt-4 font-heading text-3xl text-foreground md:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-muted-text">
        We hit an unexpected error. Please try again, or head back to the
        gallery.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center text-sm text-muted-text transition-colors hover:text-foreground"
        >
          &larr; Back to gallery
        </Link>
      </div>
    </div>
  )
}
