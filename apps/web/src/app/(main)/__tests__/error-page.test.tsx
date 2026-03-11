import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfaced.art')
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from '../error'

describe('Error Page (main route group)', () => {
  const mockError = new Error('Something went wrong')
  const mockReset = vi.fn()

  beforeEach(() => {
    mockReset.mockClear()
  })

  it('should render an error heading', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)
    expect(
      screen.getByRole('heading', { level: 1, name: /something went wrong/i })
    ).toBeInTheDocument()
  })

  it('should render a try again button that calls reset', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)
    const button = screen.getByRole('button', { name: /try again/i })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('should render a link back to the homepage', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)
    const link = screen.getByRole('link', { name: /back to gallery/i })
    expect(link).toHaveAttribute('href', '/')
  })

})
