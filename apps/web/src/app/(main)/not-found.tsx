import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="font-serif text-4xl text-foreground">Page not found</h1>
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
