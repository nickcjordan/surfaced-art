import type { Metadata } from 'next'
import { getArtistProfile } from '@/lib/api'
import type { CvEntryTypeType } from '@surfaced-art/types'

type Props = {
  params: Promise<{ slug: string }>
}

const cvEntryTypeLabels: Record<CvEntryTypeType, string> = {
  exhibition: 'Exhibitions',
  award: 'Awards',
  education: 'Education',
  press: 'Press',
  residency: 'Residencies',
  other: 'Other',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const artist = await getArtistProfile(slug)
    return {
      title: `${artist.displayName} — CV`,
      alternates: { canonical: `/${slug}/cv` },
    }
  } catch {
    return { title: 'CV' }
  }
}

export default async function PortfolioCvPage({ params }: Props) {
  const { slug } = await params
  const artist = await getArtistProfile(slug)

  const cvByType = new Map<CvEntryTypeType, typeof artist.cvEntries>()
  for (const entry of artist.cvEntries) {
    const existing = cvByType.get(entry.type) ?? []
    existing.push(entry)
    cvByType.set(entry.type, existing)
  }

  if (cvByType.size === 0) {
    return (
      <p className="py-12 text-center text-muted-text">
        No CV entries available.
      </p>
    )
  }

  return (
    <section data-testid="cv-section">
      <div className="space-y-8">
        {Array.from(cvByType.entries()).map(([type, entries]) => (
          <div key={type}>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-text">
              {cvEntryTypeLabels[type] ?? type}
            </h3>
            <ul className="space-y-2">
              {entries
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((entry) => (
                  <li key={entry.id} className="flex items-baseline gap-3">
                    <span className="shrink-0 text-sm tabular-nums text-muted-text">
                      {entry.year}
                    </span>
                    <div>
                      <span className="text-sm text-foreground">
                        {entry.title}
                      </span>
                      {entry.institution && (
                        <span className="text-sm text-muted-text">
                          {' '}
                          — {entry.institution}
                        </span>
                      )}
                      {entry.description && (
                        <p className="mt-0.5 text-xs text-muted-text">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
