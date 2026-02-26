import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'

export type BreadcrumbItem = {
  label: string
  href?: string
}

const BASE_URL = 'https://surfaced.art'

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          ...(item.href && { item: `${BASE_URL}${item.href}` }),
        })),
      }} />
      <nav aria-label="Breadcrumb" data-testid="breadcrumbs">
        <ol className="flex items-center gap-1.5 text-sm text-muted-text">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
