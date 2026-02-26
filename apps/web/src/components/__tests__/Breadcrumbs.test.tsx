import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '../Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders a nav with aria-label', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '/' }]} />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
  })

  it('renders all breadcrumb items', () => {
    render(
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Ceramics', href: '/category/ceramics' },
        { label: 'Mountain Vessel' },
      ]} />
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Ceramics')).toBeInTheDocument()
    expect(screen.getByText('Mountain Vessel')).toBeInTheDocument()
  })

  it('renders items with href as links', () => {
    render(
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Current Page' },
      ]} />
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('renders the last item without a link when it has no href', () => {
    render(
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Current Page' },
      ]} />
    )
    const current = screen.getByText('Current Page')
    expect(current.tagName).toBe('SPAN')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('renders separator between items', () => {
    const { container } = render(
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Category' },
      ]} />
    )
    expect(container.textContent).toContain('/')
  })

  it('renders BreadcrumbList JSON-LD', () => {
    const { container } = render(
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Abbey Peters' },
      ]} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
    const data = JSON.parse(script!.textContent!)
    expect(data['@type']).toBe('BreadcrumbList')
    expect(data.itemListElement).toHaveLength(2)
    expect(data.itemListElement[0].position).toBe(1)
    expect(data.itemListElement[0].name).toBe('Home')
    expect(data.itemListElement[1].position).toBe(2)
    expect(data.itemListElement[1].name).toBe('Abbey Peters')
  })

  it('has data-testid breadcrumbs', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '/' }]} />)
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument()
  })
})
