import Link from 'next/link'

export function StudioFooter() {
  return (
    <footer data-testid="studio-footer" className="border-t border-border mt-auto py-8">
      <p className="text-center text-xs tracking-wide text-muted-text">
        Powered by{' '}
        <Link
          href="/"
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Surfaced Art
        </Link>
      </p>
    </footer>
  )
}
