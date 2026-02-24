'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'

/**
 * Mobile navigation with hamburger button and slide-out drawer.
 * Only visible on screens smaller than md breakpoint.
 */
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={open}
        aria-label="Menu"
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center p-2 text-foreground hover:text-muted-foreground transition-colors"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-background shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-label="Navigation menu"
        inert={!isOpen ? true : undefined}
      >
        {/* Close button */}
        <div className="flex items-center justify-end p-6">
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="p-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Category links */}
        <nav aria-label="Mobile category navigation" className="px-6">
          <ul className="space-y-1">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  href={category.href}
                  onClick={close}
                  className="block py-3 text-base tracking-wide text-muted-foreground transition-colors hover:text-foreground border-b border-border/50"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
