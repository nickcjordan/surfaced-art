/**
 * Mock for next/link used in Vitest tests.
 * Renders a plain <a> tag with href and all other props passed through.
 */
import React from 'react'

function Link({
  href,
  children,
  ...props
}: {
  href: string
  children: React.ReactNode
  [key: string]: unknown
}) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

export default Link
