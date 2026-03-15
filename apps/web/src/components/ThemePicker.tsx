'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { Palette } from 'lucide-react'

/**
 * Temporary palette picker for manual testing.
 * Overrides brand CSS custom properties on <html> to preview different color palettes.
 * DELETE THIS COMPONENT before shipping to production.
 */

const PALETTES = [
  {
    id: 'forest-amber',
    name: 'Forest + Amber',
    swatch: '#4A6B5A',
    light: {
      '--accent-primary': '#4A6B5A',
      '--accent-primary-hover': '#3D5A4C',
      '--accent-secondary': '#C49A5A',
      '--accent-secondary-hover': '#B58A4D',
    },
    dark: {
      '--accent-primary': '#6B9B7A',
      '--accent-primary-hover': '#7DAE8C',
      '--accent-secondary': '#D4AA6A',
      '--accent-secondary-hover': '#E0BA7A',
    },
  },
  {
    id: 'espresso-cream',
    name: 'Espresso + Cream',
    swatch: '#5C4033',
    light: {
      '--accent-primary': '#5C4033',
      '--accent-primary-hover': '#4D3529',
      '--accent-secondary': '#C4AA8A',
      '--accent-secondary-hover': '#B59A7A',
    },
    dark: {
      '--accent-primary': '#8C6B55',
      '--accent-primary-hover': '#9E7D67',
      '--accent-secondary': '#D4BA9A',
      '--accent-secondary-hover': '#E0CAAA',
    },
  },
  {
    id: 'teal-gold',
    name: 'Deep Teal + Gold',
    swatch: '#2A7B7B',
    light: {
      '--accent-primary': '#2A7B7B',
      '--accent-primary-hover': '#226666',
      '--accent-secondary': '#B8956A',
      '--accent-secondary-hover': '#A6845C',
    },
    dark: {
      '--accent-primary': '#4AABAB',
      '--accent-primary-hover': '#5CBDBD',
      '--accent-secondary': '#C8A57A',
      '--accent-secondary-hover': '#D8B58A',
    },
  },
  {
    id: 'slate-gold',
    name: 'Slate + Gold',
    swatch: '#5A6A78',
    light: {
      '--accent-primary': '#5A6A78',
      '--accent-primary-hover': '#4D5C6A',
      '--accent-secondary': '#B8956A',
      '--accent-secondary-hover': '#A6845C',
    },
    dark: {
      '--accent-primary': '#8A9AAA',
      '--accent-primary-hover': '#9CAABC',
      '--accent-secondary': '#C8A57A',
      '--accent-secondary-hover': '#D8B58A',
    },
  },
  {
    id: 'bronze-charcoal',
    name: 'Bronze + Charcoal',
    swatch: '#8B7355',
    light: {
      '--accent-primary': '#8B7355',
      '--accent-primary-hover': '#7A6548',
      '--accent-secondary': '#5A5550',
      '--accent-secondary-hover': '#4A4540',
    },
    dark: {
      '--accent-primary': '#BB9D75',
      '--accent-primary-hover': '#CDAF87',
      '--accent-secondary': '#8A8580',
      '--accent-secondary-hover': '#9C9792',
    },
  },
] as const

const STORAGE_KEY = 'sa-theme-palette'

// Track client-side mount without useState/useEffect
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function applyPalette(id: string, isDark: boolean) {
  const palette = PALETTES.find(p => p.id === id)
  if (!palette) return

  const tokens = isDark ? palette.dark : palette.light
  const root = document.documentElement

  for (const [prop, value] of Object.entries(tokens)) {
    root.style.setProperty(prop, value)
  }
}

function clearPaletteOverrides() {
  const root = document.documentElement
  const props = ['--accent-primary', '--accent-primary-hover', '--accent-secondary', '--accent-secondary-hover']
  for (const prop of props) {
    root.style.removeProperty(prop)
  }
}

export function ThemePicker() {
  const mounted = useMounted()
  const [isOpen, setIsOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load saved palette on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && PALETTES.some(p => p.id === saved)) {
      setActiveId(saved)
    }
  }, [])

  // Apply palette whenever activeId or dark/light mode changes
  useEffect(() => {
    if (!activeId) {
      clearPaletteOverrides()
      return
    }

    const isDark = document.documentElement.classList.contains('dark')
    applyPalette(activeId, isDark)

    // Watch for dark mode class changes
    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark')
      applyPalette(activeId, nowDark)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [activeId])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  function selectPalette(id: string) {
    if (activeId === id) {
      // Deselect — revert to CSS default (forest-amber from globals.css)
      setActiveId(null)
      localStorage.removeItem(STORAGE_KEY)
      clearPaletteOverrides()
    } else {
      setActiveId(id)
      localStorage.setItem(STORAGE_KEY, id)
    }
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch color palette"
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors"
      >
        <Palette className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-background shadow-lg z-50 py-1">
          <p className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Color Palette
          </p>
          {PALETTES.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPalette(p.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface ${
                activeId === p.id ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full shrink-0 border border-border"
                style={{ backgroundColor: p.swatch }}
              />
              <span className="truncate">{p.name}</span>
              {activeId === p.id && (
                <span className="ml-auto text-accent-primary text-xs">Active</span>
              )}
            </button>
          ))}
          {activeId && (
            <div className="border-t border-border mt-1 pt-1">
              <button
                type="button"
                onClick={() => selectPalette(activeId)}
                className="w-full px-3 py-2 text-left text-xs text-muted-foreground hover:bg-surface transition-colors"
              >
                Reset to default
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
