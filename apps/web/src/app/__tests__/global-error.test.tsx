import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://surfaced.art')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.surfaced.art')
import { render, screen, fireEvent } from '@testing-library/react'
import GlobalError from '../global-error'

describe('Global Error Page', () => {
  const mockError = new Error('Root layout crash')
  const mockReset = vi.fn()

  beforeEach(() => {
    mockReset.mockClear()
  })

  it('should render an error heading', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)
    expect(
      screen.getByRole('heading', { level: 1, name: /something went wrong/i })
    ).toBeInTheDocument()
  })

  it('should render a try again button that calls reset', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)
    const button = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(button)
    expect(mockReset).toHaveBeenCalledTimes(1)
  })
})
