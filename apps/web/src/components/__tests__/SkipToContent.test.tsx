import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkipToContent } from '../SkipToContent'

describe('SkipToContent', () => {
  it('should render a link targeting #main-content', () => {
    render(<SkipToContent />)
    const link = screen.getByText('Skip to content')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '#main-content')
  })

  it('should be visually hidden by default (sr-only)', () => {
    render(<SkipToContent />)
    const link = screen.getByText('Skip to content')
    expect(link.className).toContain('sr-only')
  })

  it('should become visible on focus', () => {
    render(<SkipToContent />)
    const link = screen.getByText('Skip to content')
    // The focus-visible styles override sr-only
    expect(link.className).toContain('focus:not-sr-only')
  })
})
