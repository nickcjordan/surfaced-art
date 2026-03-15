'use client'

import { useState } from 'react'

/**
 * Temporary color palette demo page — finalist exploration.
 * Red dot (#AA1D45) lives in the logo only. UI primary is a separate color.
 * DELETE THIS PAGE before merging to dev.
 */

/* ─── Finalist palettes ─── */

const palettes = [
  {
    id: 'forest-amber',
    name: 'Forest + Amber',
    desc: 'Deep forest green with warm amber. Rich, natural, frames artwork like a well-lit gallery in the woods.',
    light: {
      primary: '#4A6B5A',
      primaryHover: '#3D5A4C',
      secondary: '#C49A5A',
      secondaryHover: '#B58A4D',
      background: '#FAFAF8',
      surface: '#F2F0ED',
      foreground: '#1A1A1A',
      muted: '#6B6460',
      border: '#E5E0DB',
    },
    dark: {
      primary: '#6B9B7A',
      primaryHover: '#7DAE8C',
      secondary: '#D4AA6A',
      secondaryHover: '#E0BA7A',
      background: '#1C1917',
      surface: '#282420',
      foreground: '#F5F2EE',
      muted: '#9C9590',
      border: '#3D3835',
    },
  },
  {
    id: 'espresso-cream',
    name: 'Espresso + Cream',
    desc: 'Dark espresso brown with creamy warm secondary. Minimal, sophisticated, coffee-shop-gallery vibe.',
    light: {
      primary: '#5C4033',
      primaryHover: '#4D3529',
      secondary: '#C4AA8A',
      secondaryHover: '#B59A7A',
      background: '#FAFAF8',
      surface: '#F2F0ED',
      foreground: '#1A1A1A',
      muted: '#6B6460',
      border: '#E5E0DB',
    },
    dark: {
      primary: '#8C6B55',
      primaryHover: '#9E7D67',
      secondary: '#D4BA9A',
      secondaryHover: '#E0CAAA',
      background: '#1C1917',
      surface: '#282420',
      foreground: '#F5F2EE',
      muted: '#9C9590',
      border: '#3D3835',
    },
  },
  {
    id: 'teal-gold',
    name: 'Deep Teal + Warm Gold',
    desc: 'Teal complements the red dot. Sophisticated, editorial. Gold keeps warmth in the palette.',
    light: {
      primary: '#2A7B7B',
      primaryHover: '#226666',
      secondary: '#B8956A',
      secondaryHover: '#A6845C',
      background: '#FAFAF8',
      surface: '#F2F0ED',
      foreground: '#1A1A1A',
      muted: '#6B6460',
      border: '#E5E0DB',
    },
    dark: {
      primary: '#4AABAB',
      primaryHover: '#5CBDBD',
      secondary: '#C8A57A',
      secondaryHover: '#D8B58A',
      background: '#1C1917',
      surface: '#282420',
      foreground: '#F5F2EE',
      muted: '#9C9590',
      border: '#3D3835',
    },
  },
  {
    id: 'slate-gold',
    name: 'Slate + Warm Gold',
    desc: 'Neutral slate blue, very understated. Lets the artwork do the talking. Gold adds a touch of luxury.',
    light: {
      primary: '#5A6A78',
      primaryHover: '#4D5C6A',
      secondary: '#B8956A',
      secondaryHover: '#A6845C',
      background: '#FAFAF8',
      surface: '#F2F0ED',
      foreground: '#1A1A1A',
      muted: '#6B6460',
      border: '#E5E0DB',
    },
    dark: {
      primary: '#8A9AAA',
      primaryHover: '#9CAABC',
      secondary: '#C8A57A',
      secondaryHover: '#D8B58A',
      background: '#1C1917',
      surface: '#282420',
      foreground: '#F5F2EE',
      muted: '#9C9590',
      border: '#3D3835',
    },
  },
  {
    id: 'bronze-charcoal',
    name: 'Bronze + Charcoal',
    desc: 'Rich bronze primary with charcoal secondary. Luxurious, aged metal feel. Very premium.',
    light: {
      primary: '#8B7355',
      primaryHover: '#7A6548',
      secondary: '#5A5550',
      secondaryHover: '#4A4540',
      background: '#FAFAF8',
      surface: '#F2F0ED',
      foreground: '#1A1A1A',
      muted: '#6B6460',
      border: '#E5E0DB',
    },
    dark: {
      primary: '#BB9D75',
      primaryHover: '#CDAF87',
      secondary: '#8A8580',
      secondaryHover: '#9C9792',
      background: '#1C1917',
      surface: '#282420',
      foreground: '#F5F2EE',
      muted: '#9C9590',
      border: '#3D3835',
    },
  },
]

const statusColors = {
  light: { error: '#C4534A', success: '#6B8F6B', warning: '#D4A054' },
  dark: { error: '#D4645C', success: '#7FA37F', warning: '#E0B060' },
}

/* ─── Inline SVG logo ─── */
function LogoMark({ dotColor, frameColor, size = 56 }: { dotColor: string; frameColor: string; size?: number }) {
  const scale = size / 94
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={97.9 * scale} height={93.94 * scale} viewBox="0 0 97.90087 93.93799">
      <circle cx="82.31032" cy="61.73679" r="15.59055" fill={dotColor} />
      <path fill={frameColor} d="M309.10534,233.46646a21.22513,21.22513,0,0,1-3.57935-.32556v2.01892a2.16358,2.16358,0,0,1-2.16113,2.16113H236.04259a2.16316,2.16316,0,0,1-2.16064-2.16113V159.71793a2.16317,2.16317,0,0,1,2.16064-2.16114h67.32227a2.16359,2.16359,0,0,1,2.16113,2.16114v31.55444a19.77464,19.77464,0,0,1,7.08594-.01111V159.71793a9.25835,9.25835,0,0,0-9.24707-9.24805H236.04259a9.25845,9.25845,0,0,0-9.24756,9.24805v75.44189a9.25845,9.25845,0,0,0,9.24756,9.24805h67.32227a9.25835,9.25835,0,0,0,9.24707-9.24805V233.152A21.21845,21.21845,0,0,1,309.10534,233.46646Z" transform="translate(-226.79503 -150.46988)" />
    </svg>
  )
}

/* ─── Mock listing image placeholder ─── */
function ArtworkPlaceholder({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="aspect-[4/5] rounded-md overflow-hidden relative" style={{
      background: `linear-gradient(160deg, ${primary}20, ${secondary}30, ${primary}10)`,
    }}>
      {/* Abstract shapes to simulate artwork */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <svg viewBox="0 0 100 120" className="w-2/3 h-2/3">
          <circle cx="35" cy="40" r="20" fill={primary} />
          <rect x="50" y="50" width="35" height="45" rx="4" fill={secondary} opacity="0.7" />
          <path d="M10 90 Q30 60 50 85 T90 75" stroke={primary} strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

/* ─── Full UI mockup for a single palette + mode ─── */
function PaletteMockup({ palette, mode }: { palette: typeof palettes[0]; mode: 'light' | 'dark' }) {
  const c = palette[mode]
  const status = statusColors[mode]

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: c.background, color: c.foreground }}>

      {/* ── Header bar ── */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${c.border}` }}>
        <div className="flex items-center gap-2.5">
          <LogoMark dotColor="#AA1D45" frameColor={c.foreground} size={28} />
          <span className="font-serif text-sm tracking-wide">Surfaced Art</span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: c.muted }}>
          <span className="hover:underline cursor-default" style={{ color: c.primary }}>Browse</span>
          <span className="hover:underline cursor-default">Artists</span>
          <button className="px-3 py-1 rounded-md font-medium text-white"
            style={{ backgroundColor: c.primary }}>Sign In</button>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div className="px-5 py-6" style={{ background: `linear-gradient(135deg, ${c.primary}08, ${c.secondary}12)` }}>
        <h2 className="font-serif text-xl mb-1">Discover Handmade Art</h2>
        <p className="text-xs mb-3" style={{ color: c.muted }}>Curated works from vetted artists, delivered to your door.</p>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
            style={{ backgroundColor: c.primary }}>Explore Gallery</button>
          <button className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ backgroundColor: 'transparent', color: c.primary, border: `1px solid ${c.primary}` }}>For Artists</button>
        </div>
      </div>

      {/* ── Listing cards grid ── */}
      <div className="px-5 py-4">
        <h3 className="font-serif text-sm mb-3">Featured Works</h3>
        <div className="grid grid-cols-3 gap-3">
          {['Morning Light', 'Quiet Garden', 'Passage III'].map((title, i) => (
            <div key={title} className="rounded-md overflow-hidden" style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}>
              <ArtworkPlaceholder primary={c.primary} secondary={c.secondary} />
              <div className="p-2 space-y-0.5">
                <p className="text-[11px] font-medium truncate">{title}</p>
                <p className="text-[10px]" style={{ color: c.muted }}>Artist Name</p>
                <p className="text-[11px] font-semibold" style={{ color: c.primary }}>
                  ${(850 + i * 200).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Artist card ── */}
      <div className="px-5 py-4">
        <h3 className="font-serif text-sm mb-3">Artist Spotlight</h3>
        <div className="flex gap-3 rounded-md p-3" style={{ backgroundColor: c.surface, border: `1px solid ${c.border}` }}>
          <div className="w-12 h-12 rounded-full flex-shrink-0" style={{
            background: `linear-gradient(135deg, ${c.primary}40, ${c.secondary}60)`,
          }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">Elena Cordova</p>
            <p className="text-[10px] mb-1.5" style={{ color: c.muted }}>Portland, OR</p>
            <div className="flex gap-1 flex-wrap">
              {['Painting', 'Mixed Media'].map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                  style={{ backgroundColor: `${c.primary}18`, color: c.primary }}>{tag}</span>
              ))}
            </div>
          </div>
          <button className="self-start px-2 py-1 rounded text-[10px] font-medium"
            style={{ color: c.primary, border: `1px solid ${c.primary}` }}>View</button>
        </div>
      </div>

      {/* ── Category nav ── */}
      <div className="px-5 py-3 flex gap-2" style={{ borderTop: `1px solid ${c.border}` }}>
        {['Painting', 'Sculpture', 'Ceramics', 'Fiber Art'].map((cat, i) => (
          <span key={cat} className="px-2 py-1 rounded-md text-[10px] font-medium cursor-default"
            style={i === 0
              ? { backgroundColor: c.primary, color: mode === 'dark' ? c.background : '#fff' }
              : { backgroundColor: c.surface, color: c.muted, border: `1px solid ${c.border}` }
            }>{cat}</span>
        ))}
      </div>

      {/* ── Form elements ── */}
      <div className="px-5 py-4 space-y-2" style={{ borderTop: `1px solid ${c.border}` }}>
        <div className="flex gap-2">
          <input type="text" placeholder="Search artworks..." readOnly
            className="flex-1 px-2.5 py-1.5 rounded-md text-xs outline-none"
            style={{ backgroundColor: c.surface, color: c.foreground, border: `1px solid ${c.border}` }} />
          <button className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
            style={{ backgroundColor: c.primary }}>Search</button>
        </div>
        <div className="flex gap-2 items-center text-[10px]">
          <span style={{ color: status.success }}>Available</span>
          <span style={{ color: c.muted }}>/</span>
          <span style={{ color: status.warning }}>Reserved</span>
          <span style={{ color: c.muted }}>/</span>
          <span style={{ color: status.error }}>Sold</span>
          <span className="ml-auto underline cursor-default" style={{ color: c.primary }}>View all listings</span>
        </div>
      </div>

      {/* ── Buttons row ── */}
      <div className="px-5 py-3 flex gap-1.5 flex-wrap" style={{ borderTop: `1px solid ${c.border}` }}>
        <button className="px-2.5 py-1 rounded-md text-[10px] font-medium text-white"
          style={{ backgroundColor: c.primary }}>Primary</button>
        <button className="px-2.5 py-1 rounded-md text-[10px] font-medium text-white"
          style={{ backgroundColor: c.secondary }}>Secondary</button>
        <button className="px-2.5 py-1 rounded-md text-[10px] font-medium text-white"
          style={{ backgroundColor: status.error }}>Destructive</button>
        <button className="px-2.5 py-1 rounded-md text-[10px] font-medium"
          style={{ backgroundColor: 'transparent', color: c.primary, border: `1px solid ${c.primary}` }}>Outline</button>
        <button className="px-2.5 py-1 rounded-md text-[10px] font-medium"
          style={{ backgroundColor: c.surface, color: c.foreground, border: `1px solid ${c.border}` }}>Ghost</button>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 text-[10px] flex justify-between" style={{ backgroundColor: c.surface, color: c.muted, borderTop: `1px solid ${c.border}` }}>
        <span>Surfaced Art LLC</span>
        <div className="flex gap-3">
          <span className="underline cursor-default" style={{ color: c.primary }}>Terms</span>
          <span className="underline cursor-default" style={{ color: c.primary }}>Privacy</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Swatch strip ─── */
function SwatchStrip({ palette, mode }: { palette: typeof palettes[0]; mode: 'light' | 'dark' }) {
  const c = palette[mode]
  const swatches = [
    { label: 'Primary', color: c.primary },
    { label: 'Secondary', color: c.secondary },
    { label: 'BG', color: c.background },
    { label: 'Surface', color: c.surface },
    { label: 'Text', color: c.foreground },
    { label: 'Muted', color: c.muted },
    { label: 'Border', color: c.border },
  ]
  return (
    <div className="flex gap-1">
      {swatches.map(s => (
        <div key={s.label} className="flex flex-col items-center gap-0.5">
          <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: s.color }} />
          <span className="text-[8px] text-muted-foreground">{s.label}</span>
          <span className="text-[7px] font-mono text-muted-foreground/60">{s.color}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Page ─── */

type ViewMode = 'all' | 'light-only' | 'dark-only'

export default function ColorDemoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 space-y-12">
      <div>
        <h1 className="font-serif text-3xl mb-2">Color Palette Finalists</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Five finalists shown with full UI mockups in both light and dark mode.
          Red dot (#AA1D45) is logo-only — never on interactive elements.
        </p>

        {/* View toggle */}
        <div className="flex gap-1.5 mt-4">
          {([['all', 'Light + Dark'], ['light-only', 'Light Only'], ['dark-only', 'Dark Only']] as const).map(([id, label]) => (
            <button key={id}
              onClick={() => setViewMode(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === id
                  ? 'bg-foreground text-background'
                  : 'bg-surface text-muted-foreground border border-border hover:bg-muted/10'
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {palettes.map(p => (
        <section key={p.id} className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl">{p.name}</h2>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </div>

          {/* Swatches */}
          <div className={`flex gap-8 ${viewMode === 'dark-only' ? 'hidden' : ''}`}>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Light</p>
              <SwatchStrip palette={p} mode="light" />
            </div>
            {viewMode === 'all' && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Dark</p>
                <SwatchStrip palette={p} mode="dark" />
              </div>
            )}
          </div>
          {viewMode === 'dark-only' && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Dark</p>
              <SwatchStrip palette={p} mode="dark" />
            </div>
          )}

          {/* Mockups */}
          <div className={`grid gap-6 ${viewMode === 'all' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>
            {(viewMode === 'all' || viewMode === 'light-only') && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Light Mode</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <PaletteMockup palette={p} mode="light" />
                </div>
              </div>
            )}
            {(viewMode === 'all' || viewMode === 'dark-only') && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Dark Mode</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <PaletteMockup palette={p} mode="dark" />
                </div>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* ── Side-by-side comparison strip ── */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl border-b border-border pb-2">Quick Comparison — Buttons & Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {palettes.map(p => {
            const light = p.light
            const dark = p.dark
            return (
              <div key={p.id} className="space-y-3">
                <p className="text-xs font-medium text-center">{p.id}</p>
                {/* Light */}
                <div className="rounded-md p-3 space-y-1.5" style={{ backgroundColor: light.background, border: `1px solid ${light.border}` }}>
                  <p className="text-[9px] font-medium" style={{ color: light.muted }}>Light</p>
                  <button className="w-full px-2 py-1.5 rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: light.primary }}>Primary</button>
                  <button className="w-full px-2 py-1.5 rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: light.secondary }}>Secondary</button>
                  <button className="w-full px-2 py-1.5 rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: statusColors.light.error }}>Destructive</button>
                  <p className="text-[10px] underline text-center" style={{ color: light.primary }}>Link text</p>
                </div>
                {/* Dark */}
                <div className="rounded-md p-3 space-y-1.5" style={{ backgroundColor: dark.background, border: `1px solid ${dark.border}` }}>
                  <p className="text-[9px] font-medium" style={{ color: dark.muted }}>Dark</p>
                  <button className="w-full px-2 py-1.5 rounded-md text-[10px] font-medium"
                    style={{ backgroundColor: dark.primary, color: dark.background }}>Primary</button>
                  <button className="w-full px-2 py-1.5 rounded-md text-[10px] font-medium"
                    style={{ backgroundColor: dark.secondary, color: dark.background }}>Secondary</button>
                  <button className="w-full px-2 py-1.5 rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: statusColors.dark.error }}>Destructive</button>
                  <p className="text-[10px] underline text-center" style={{ color: dark.primary }}>Link text</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <p className="text-xs text-muted-foreground italic text-center">Temporary page — delete before merging.</p>
    </div>
  )
}
