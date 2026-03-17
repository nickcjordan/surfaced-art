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
    id: 'forest-teal',
    name: 'Forest Green + Teal',
    swatch: '#3D6B4F',
    light: {
      '--accent-primary': '#3D6B4F',
      '--accent-primary-hover': '#325A42',
      '--accent-secondary': '#3D8A8A',
      '--accent-secondary-hover': '#337575',
    },
    dark: {
      '--accent-primary': '#5FA878',
      '--accent-primary-hover': '#70BA8A',
      '--accent-secondary': '#5AACAC',
      '--accent-secondary-hover': '#6CBDBD',
    },
  },
  {
    id: 'navy-dusty-rose',
    name: 'Deep Navy + Dusty Rose',
    swatch: '#2C3E5A',
    light: {
      '--accent-primary': '#2C3E5A',
      '--accent-primary-hover': '#243350',
      '--accent-secondary': '#B5707A',
      '--accent-secondary-hover': '#A36068',
    },
    dark: {
      '--accent-primary': '#5A7AAA',
      '--accent-primary-hover': '#6A8ABC',
      '--accent-secondary': '#D08A92',
      '--accent-secondary-hover': '#DA9AA2',
    },
  },
  {
    id: 'charcoal-sage',
    name: 'Charcoal + Sage',
    swatch: '#3A3A3C',
    light: {
      '--accent-primary': '#3A3A3C',
      '--accent-primary-hover': '#2E2E30',
      '--accent-secondary': '#7A9A7A',
      '--accent-secondary-hover': '#6B8B6B',
    },
    dark: {
      '--accent-primary': '#A0A0A5',
      '--accent-primary-hover': '#B0B0B5',
      '--accent-secondary': '#8CB88C',
      '--accent-secondary-hover': '#9CCA9C',
    },
  },
  {
    id: 'indigo-slate',
    name: 'Indigo + Slate',
    swatch: '#4A4E78',
    light: {
      '--accent-primary': '#4A4E78',
      '--accent-primary-hover': '#3E4268',
      '--accent-secondary': '#6B7A88',
      '--accent-secondary-hover': '#5C6A78',
    },
    dark: {
      '--accent-primary': '#7A80B0',
      '--accent-primary-hover': '#8A90C0',
      '--accent-secondary': '#8A9AAA',
      '--accent-secondary-hover': '#9CAABC',
    },
  },
  {
    id: 'warm-stone-teal',
    name: 'Warm Stone + Teal',
    swatch: '#6B5E55',
    light: {
      '--accent-primary': '#6B5E55',
      '--accent-primary-hover': '#5C5048',
      '--accent-secondary': '#3D8A8A',
      '--accent-secondary-hover': '#337575',
    },
    dark: {
      '--accent-primary': '#9A8C82',
      '--accent-primary-hover': '#AA9C92',
      '--accent-secondary': '#5AACAC',
      '--accent-secondary-hover': '#6CBDBD',
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
    id: 'navy-sage',
    name: 'Deep Navy + Sage',
    swatch: '#2C3E5A',
    light: {
      '--accent-primary': '#2C3E5A',
      '--accent-primary-hover': '#243350',
      '--accent-secondary': '#7A9A7A',
      '--accent-secondary-hover': '#6B8B6B',
    },
    dark: {
      '--accent-primary': '#5A7AAA',
      '--accent-primary-hover': '#6A8ABC',
      '--accent-secondary': '#8CB88C',
      '--accent-secondary-hover': '#9CCA9C',
    },
  },
  {
    id: 'forest-dusty-rose',
    name: 'Forest Green + Dusty Rose',
    swatch: '#3D6B4F',
    light: {
      '--accent-primary': '#3D6B4F',
      '--accent-primary-hover': '#325A42',
      '--accent-secondary': '#B5707A',
      '--accent-secondary-hover': '#A36068',
    },
    dark: {
      '--accent-primary': '#5FA878',
      '--accent-primary-hover': '#70BA8A',
      '--accent-secondary': '#D08A92',
      '--accent-secondary-hover': '#DA9AA2',
    },
  },
  {
    id: 'espresso-teal',
    name: 'Espresso + Teal',
    swatch: '#5C4033',
    light: {
      '--accent-primary': '#5C4033',
      '--accent-primary-hover': '#4D3529',
      '--accent-secondary': '#3D8A8A',
      '--accent-secondary-hover': '#337575',
    },
    dark: {
      '--accent-primary': '#8C6B55',
      '--accent-primary-hover': '#9E7D67',
      '--accent-secondary': '#5AACAC',
      '--accent-secondary-hover': '#6CBDBD',
    },
  },
  {
    id: 'forest-gray',
    name: 'Forest Green + Warm Gray',
    swatch: '#3D6B4F',
    light: {
      '--accent-primary': '#3D6B4F',
      '--accent-primary-hover': '#325A42',
      '--accent-secondary': '#8A8580',
      '--accent-secondary-hover': '#7A7570',
    },
    dark: {
      '--accent-primary': '#5FA878',
      '--accent-primary-hover': '#70BA8A',
      '--accent-secondary': '#A09B96',
      '--accent-secondary-hover': '#B0ABA6',
    },
  },
  {
    id: 'teal-gray',
    name: 'Teal + Cool Gray',
    swatch: '#2A7B7B',
    light: {
      '--accent-primary': '#2A7B7B',
      '--accent-primary-hover': '#226666',
      '--accent-secondary': '#7A8088',
      '--accent-secondary-hover': '#6A7078',
    },
    dark: {
      '--accent-primary': '#4AABAB',
      '--accent-primary-hover': '#5CBDBD',
      '--accent-secondary': '#959AA0',
      '--accent-secondary-hover': '#A5AAB0',
    },
  },
  {
    id: 'navy-gray',
    name: 'Deep Navy + Cool Gray',
    swatch: '#2C3E5A',
    light: {
      '--accent-primary': '#2C3E5A',
      '--accent-primary-hover': '#243350',
      '--accent-secondary': '#7A8088',
      '--accent-secondary-hover': '#6A7078',
    },
    dark: {
      '--accent-primary': '#5A7AAA',
      '--accent-primary-hover': '#6A8ABC',
      '--accent-secondary': '#959AA0',
      '--accent-secondary-hover': '#A5AAB0',
    },
  },
  {
    id: 'espresso-gray',
    name: 'Espresso + Warm Gray',
    swatch: '#5C4033',
    light: {
      '--accent-primary': '#5C4033',
      '--accent-primary-hover': '#4D3529',
      '--accent-secondary': '#8A8580',
      '--accent-secondary-hover': '#7A7570',
    },
    dark: {
      '--accent-primary': '#8C6B55',
      '--accent-primary-hover': '#9E7D67',
      '--accent-secondary': '#A09B96',
      '--accent-secondary-hover': '#B0ABA6',
    },
  },
] as const

const STORAGE_KEY = 'sa-theme-palette'
const OVERRIDE_PROPS = ['--accent-primary', '--accent-primary-hover', '--accent-secondary', '--accent-secondary-hover']

// Track client-side mount without useState/useEffect
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function getStoredPaletteId(): string | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved && PALETTES.some(p => p.id === saved) ? saved : null
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
  for (const prop of OVERRIDE_PROPS) {
    root.style.removeProperty(prop)
  }
}

export function ThemePicker() {
  const mounted = useMounted()
  const [isOpen, setIsOpen] = useState(false)
  // Lazy initializer reads localStorage synchronously — no setState-in-effect needed
  const [activeId, setActiveId] = useState<string | null>(getStoredPaletteId)
  const menuRef = useRef<HTMLDivElement>(null)

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
        aria-haspopup="menu"
        className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors"
      >
        <Palette className="h-5 w-5" />
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-background shadow-lg z-50 py-1">
          <p className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Color Palette
          </p>
          {PALETTES.map(p => (
            <button
              role="menuitem"
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
