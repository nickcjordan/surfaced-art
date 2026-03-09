/**
 * Canvas Dot Texture Overlay
 *
 * A subtle repeating SVG dot pattern that simulates canvas/paper weave.
 * Zero JS, pure CSS — no performance cost.
 *
 * USAGE RULE: Apply only to "platform voice" pages (marketing, about, legal,
 * account/admin). Do NOT apply to artwork showcase pages (artist profiles,
 * listing detail, category browse, search results) — artwork should sit in
 * clean, quiet space without competing texture.
 *
 * Usage:
 *   <div className="relative overflow-hidden">
 *     <CanvasDotOverlay />
 *     <div className="relative">{content}</div>
 *   </div>
 *
 * The parent needs `relative overflow-hidden` and the content needs `relative`
 * to sit above the overlay.
 */

const CANVAS_TEXTURE_URL = `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' x='0' y='0' fill='%23000' /%3E%3Crect width='1' height='1' x='3' y='3' fill='%23000' /%3E%3C/svg%3E")`

/**
 * Standard overlay — fills the nearest positioned parent.
 * Parent needs `relative overflow-hidden`.
 */
export function CanvasDotOverlay({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: CANVAS_TEXTURE_URL,
        backgroundSize: '6px 6px',
        opacity: 0.06,
      }}
      aria-hidden="true"
    />
  )
}

/**
 * Full-bleed overlay — stretches edge-to-edge of the viewport regardless of
 * parent Container width. Use on text-only pages (about, privacy, terms) where
 * the texture should feel like the page background, not a bounded box.
 * Parent needs `relative`.
 */
export function CanvasDotOverlayFullBleed({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 ${className}`}
      style={{
        left: '50%',
        width: '100vw',
        marginLeft: '-50vw',
        backgroundImage: CANVAS_TEXTURE_URL,
        backgroundSize: '6px 6px',
        opacity: 0.06,
      }}
      aria-hidden="true"
    />
  )
}
