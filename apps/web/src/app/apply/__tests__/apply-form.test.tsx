import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplicationForm } from '../application-form'

const mockSubmitApplication = vi.fn()
const mockCheckApplicationEmail = vi.fn()

vi.mock('@/lib/api', () => ({
  submitApplication: (...args: unknown[]) => mockSubmitApplication(...args),
  checkApplicationEmail: (...args: unknown[]) => mockCheckApplicationEmail(...args),
  ApiError: class extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
      this.name = 'ApiError'
    }
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckApplicationEmail.mockResolvedValue({ exists: false })
})

describe('ApplicationForm', () => {
  it('should render all form fields with correct data-testid attributes', () => {
    render(<ApplicationForm />)

    expect(screen.getByTestId('apply-form')).toBeInTheDocument()
    expect(screen.getByTestId('apply-full-name')).toBeInTheDocument()
    expect(screen.getByTestId('apply-email')).toBeInTheDocument()
    expect(screen.getByTestId('apply-instagram')).toBeInTheDocument()
    expect(screen.getByTestId('apply-website')).toBeInTheDocument()
    expect(screen.getByTestId('apply-statement')).toBeInTheDocument()
    expect(screen.getByTestId('apply-exhibition-history')).toBeInTheDocument()
    expect(screen.getByTestId('apply-categories')).toBeInTheDocument()
    expect(screen.getByTestId('apply-submit')).toBeInTheDocument()
  })

  it('should render all 9 category toggle buttons', () => {
    render(<ApplicationForm />)

    expect(screen.getByTestId('apply-category-ceramics')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-painting')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-print')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-jewelry')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-illustration')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-photography')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-woodworking')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-fibers')).toBeInTheDocument()
    expect(screen.getByTestId('apply-category-mixed_media')).toBeInTheDocument()
  })

  it('should toggle category selection on click', async () => {
    const user = userEvent.setup()
    render(<ApplicationForm />)

    const ceramicsBtn = screen.getByTestId('apply-category-ceramics')
    await user.click(ceramicsBtn)
    expect(ceramicsBtn).toHaveAttribute('aria-pressed', 'true')

    await user.click(ceramicsBtn)
    expect(ceramicsBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('should show validation errors on submit with empty required fields', async () => {
    const user = userEvent.setup()
    render(<ApplicationForm />)

    await user.click(screen.getByTestId('apply-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('apply-error-fullName')).toBeInTheDocument()
      expect(screen.getByTestId('apply-error-email')).toBeInTheDocument()
      expect(screen.getByTestId('apply-error-statement')).toBeInTheDocument()
      expect(screen.getByTestId('apply-error-categories')).toBeInTheDocument()
    })

    expect(mockSubmitApplication).not.toHaveBeenCalled()
  })

  it('should show validation error for short statement', async () => {
    const user = userEvent.setup()
    render(<ApplicationForm />)

    await user.type(screen.getByTestId('apply-full-name'), 'Jane Artist')
    await user.type(screen.getByTestId('apply-email'), 'jane@example.com')
    await user.type(screen.getByTestId('apply-statement'), 'Too short.')
    await user.click(screen.getByTestId('apply-category-ceramics'))
    await user.click(screen.getByTestId('apply-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('apply-error-statement')).toBeInTheDocument()
    })
  })

  it('should show success state after successful submission', async () => {
    const user = userEvent.setup()
    mockSubmitApplication.mockResolvedValue({
      message: 'Application submitted successfully',
      applicationId: 'test-id',
    })

    render(<ApplicationForm />)

    await user.type(screen.getByTestId('apply-full-name'), 'Jane Artist')
    await user.type(screen.getByTestId('apply-email'), 'jane@example.com')
    await user.type(
      screen.getByTestId('apply-statement'),
      'I create handmade ceramics that explore the intersection of form and function in everyday life.'
    )
    await user.click(screen.getByTestId('apply-category-ceramics'))
    await user.click(screen.getByTestId('apply-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('apply-success')).toBeInTheDocument()
    })

    expect(mockSubmitApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Jane Artist',
        email: 'jane@example.com',
        categories: ['ceramics'],
      })
    )
  })

  it('should show error message on API failure', async () => {
    const user = userEvent.setup()
    mockSubmitApplication.mockRejectedValue(new Error('Network error'))

    render(<ApplicationForm />)

    await user.type(screen.getByTestId('apply-full-name'), 'Jane Artist')
    await user.type(screen.getByTestId('apply-email'), 'jane@example.com')
    await user.type(
      screen.getByTestId('apply-statement'),
      'I create handmade ceramics that explore the intersection of form and function in everyday life.'
    )
    await user.click(screen.getByTestId('apply-category-ceramics'))
    await user.click(screen.getByTestId('apply-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('apply-error')).toBeInTheDocument()
    })
  })

  it('should show duplicate message on 409 response', async () => {
    const user = userEvent.setup()
    const { ApiError } = await import('@/lib/api')
    mockSubmitApplication.mockRejectedValue(new ApiError(409, 'Conflict'))

    render(<ApplicationForm />)

    await user.type(screen.getByTestId('apply-full-name'), 'Jane Artist')
    await user.type(screen.getByTestId('apply-email'), 'jane@example.com')
    await user.type(
      screen.getByTestId('apply-statement'),
      'I create handmade ceramics that explore the intersection of form and function in everyday life.'
    )
    await user.click(screen.getByTestId('apply-category-ceramics'))
    await user.click(screen.getByTestId('apply-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('apply-error')).toBeInTheDocument()
      expect(screen.getByTestId('apply-error').textContent).toMatch(/already/i)
    })
  })

  it('should prevent submit when duplicate email is detected on blur', async () => {
    const user = userEvent.setup()
    mockCheckApplicationEmail.mockResolvedValueOnce({ exists: true, status: 'pending' })

    render(<ApplicationForm />)

    await user.type(screen.getByTestId('apply-full-name'), 'Jane Artist')
    await user.type(screen.getByTestId('apply-email'), 'jane@example.com')

    // Blur the email field to trigger the duplicate check
    await user.tab()

    await waitFor(() => {
      expect(screen.getByTestId('apply-error-email')).toBeInTheDocument()
      expect(screen.getByTestId('apply-error-email').textContent).toMatch(/already/i)
    })

    await user.type(
      screen.getByTestId('apply-statement'),
      'I create handmade ceramics that explore the intersection of form and function in everyday life.'
    )
    await user.click(screen.getByTestId('apply-category-ceramics'))
    await user.click(screen.getByTestId('apply-submit'))

    expect(mockSubmitApplication).not.toHaveBeenCalled()
  })

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup()
    // Never resolves — keeps form in submitting state
    mockSubmitApplication.mockReturnValue(new Promise(() => {}))

    render(<ApplicationForm />)

    await user.type(screen.getByTestId('apply-full-name'), 'Jane Artist')
    await user.type(screen.getByTestId('apply-email'), 'jane@example.com')
    await user.type(
      screen.getByTestId('apply-statement'),
      'I create handmade ceramics that explore the intersection of form and function in everyday life.'
    )
    await user.click(screen.getByTestId('apply-category-ceramics'))
    await user.click(screen.getByTestId('apply-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('apply-submit')).toBeDisabled()
    })
  })
})
