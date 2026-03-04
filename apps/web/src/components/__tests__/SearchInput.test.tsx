import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from '../SearchInput'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('SearchInput', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render a search toggle button', () => {
    render(<SearchInput />)
    expect(screen.getByTestId('search-toggle')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })

  it('should expand to input when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchInput />)

    await user.click(screen.getByTestId('search-toggle'))

    expect(screen.getByTestId('search-input')).toBeInTheDocument()
    expect(screen.getByTestId('search-form')).toBeInTheDocument()
  })

  it('should collapse when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchInput />)

    await user.click(screen.getByTestId('search-toggle'))
    expect(screen.getByTestId('search-input')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close search' }))
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()
    expect(screen.getByTestId('search-toggle')).toBeInTheDocument()
  })

  it('should collapse when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<SearchInput />)

    await user.click(screen.getByTestId('search-toggle'))
    expect(screen.getByTestId('search-input')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()
  })

  it('should navigate to /search?q= on submit', async () => {
    const user = userEvent.setup()
    render(<SearchInput />)

    await user.click(screen.getByTestId('search-toggle'))
    await user.type(screen.getByTestId('search-input'), 'ceramic vase')
    await user.keyboard('{Enter}')

    expect(mockPush).toHaveBeenCalledWith('/search?q=ceramic%20vase')
  })

  it('should not navigate on empty query submit', async () => {
    const user = userEvent.setup()
    render(<SearchInput />)

    await user.click(screen.getByTestId('search-toggle'))
    await user.keyboard('{Enter}')

    expect(mockPush).not.toHaveBeenCalled()
  })
})
