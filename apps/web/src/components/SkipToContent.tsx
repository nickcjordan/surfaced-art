/**
 * Visually hidden skip-to-content link for keyboard/screen reader users.
 * Becomes visible on focus. Should be the first focusable element on the page.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-ring"
    >
      Skip to content
    </a>
  )
}
