import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockPathname = '/abbey-peters'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

import { PortfolioNav } from '../PortfolioNav'

describe('PortfolioNav', () => {
  beforeEach(() => {
    mockPathname = '/abbey-peters'
  })

  it('should render a nav element with portfolio-nav testid', () => {
    render(<PortfolioNav slug="abbey-peters" hasCv />)
    expect(screen.getByTestId('portfolio-nav')).toBeInTheDocument()
  })

  it('should render Work and About links always', () => {
    render(<PortfolioNav slug="abbey-peters" hasCv={false} />)
    expect(screen.getByRole('link', { name: 'Work' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('should render CV link when hasCv is true', () => {
    render(<PortfolioNav slug="abbey-peters" hasCv />)
    expect(screen.getByRole('link', { name: 'CV' })).toBeInTheDocument()
  })

  it('should not render CV link when hasCv is false', () => {
    render(<PortfolioNav slug="abbey-peters" hasCv={false} />)
    expect(screen.queryByRole('link', { name: 'CV' })).not.toBeInTheDocument()
  })

  it('should link to correct paths', () => {
    render(<PortfolioNav slug="abbey-peters" hasCv />)
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute(
      'href',
      '/abbey-peters'
    )
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/abbey-peters/about'
    )
    expect(screen.getByRole('link', { name: 'CV' })).toHaveAttribute(
      'href',
      '/abbey-peters/cv'
    )
  })

  it('should highlight the Work link when on the base path', () => {
    mockPathname = '/abbey-peters'
    render(<PortfolioNav slug="abbey-peters" hasCv />)
    const workLink = screen.getByRole('link', { name: 'Work' })
    expect(workLink.className).toContain('font-medium')
  })

  it('should highlight the About link when on the about path', () => {
    mockPathname = '/abbey-peters/about'
    render(<PortfolioNav slug="abbey-peters" hasCv />)
    const aboutLink = screen.getByRole('link', { name: 'About' })
    expect(aboutLink.className).toContain('font-medium')
    const workLink = screen.getByRole('link', { name: 'Work' })
    expect(workLink.className).not.toContain('font-medium')
  })

  it('should highlight the CV link when on the cv path', () => {
    mockPathname = '/abbey-peters/cv'
    render(<PortfolioNav slug="abbey-peters" hasCv />)
    const cvLink = screen.getByRole('link', { name: 'CV' })
    expect(cvLink.className).toContain('font-medium')
  })
})
