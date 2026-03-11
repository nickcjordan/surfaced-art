import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found — Surfaced Art',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-semibold text-muted-text">404</p>
      <h1 className="mt-4 font-serif text-3xl text-foreground md:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-muted-text">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-muted-text transition-colors hover:text-foreground"
      >
        &larr; Back to gallery
      </Link>
    </div>
  )
}
