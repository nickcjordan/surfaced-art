'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Expandable search input for the site header.
 * Desktop: magnifying glass icon → expands to text input inline.
 * Enter navigates to /search?q=..., Escape/X collapses.
 */
export function SearchInput() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = query.trim()
      if (trimmed) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`)
        close()
      }
    },
    [query, router, close],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    },
    [close],
  )

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Search"
        data-testid="search-toggle"
        className="inline-flex items-center justify-center p-2 text-foreground hover:text-muted-foreground transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="search-form"
      className="flex items-center gap-2"
    >
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search art..."
        autoComplete="off"
        data-testid="search-input"
        className="h-9 w-40 md:w-56 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-accent-primary focus-visible:ring-accent-primary/50 focus-visible:ring-[3px] transition-[border-color] duration-200"
      />
      <button
        type="button"
        onClick={close}
        aria-label="Close search"
        className="inline-flex items-center justify-center p-1.5 text-foreground hover:text-muted-foreground transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </form>
  )
}
