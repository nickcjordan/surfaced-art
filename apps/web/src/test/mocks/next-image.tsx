/**
 * Mock for next/image used in Vitest tests.
 * Renders a plain <img> tag with src, alt, and common props.
 * Next.js-specific props (fill, unoptimized) are accepted but ignored.
 */
import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Image({ src, alt, fill, unoptimized, ...props }: Record<string, unknown>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src as string} alt={alt as string} {...props} />
}

export default Image
