import Link from 'next/link'

export function StudioFooter() {
  return (
    <footer className="border-t border-border mt-auto py-6">
      <p className="text-center text-xs text-muted-text">
        Powered by{' '}
        <Link
          href="/"
          className="transition-colors hover:text-foreground"
        >
          Surfaced Art
        </Link>
      </p>
    </footer>
  )
}
