import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewToggle } from '../ViewToggle'

const options = [
  { value: 'pieces' as const, label: 'Pieces' },
  { value: 'artists' as const, label: 'Artists' },
]

describe('ViewToggle', () => {
  it('should render all options as tabs', () => {
    render(<ViewToggle options={options} value="pieces" onChange={() => {}} id="test" />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveTextContent('Pieces')
    expect(tabs[1]).toHaveTextContent('Artists')
  })

  it('should mark the active option with aria-selected', () => {
    render(<ViewToggle options={options} value="pieces" onChange={() => {}} id="test" />)

    const pieces = screen.getByRole('tab', { name: 'Pieces' })
    const artists = screen.getByRole('tab', { name: 'Artists' })
    expect(pieces).toHaveAttribute('aria-selected', 'true')
    expect(artists).toHaveAttribute('aria-selected', 'false')
  })

  it('should call onChange when clicking an inactive option', async () => {
    const onChange = vi.fn()
    render(<ViewToggle options={options} value="pieces" onChange={onChange} id="test" />)

    await userEvent.click(screen.getByRole('tab', { name: 'Artists' }))
    expect(onChange).toHaveBeenCalledWith('artists')
  })

  it('should not call onChange when clicking the active option', async () => {
    const onChange = vi.fn()
    render(<ViewToggle options={options} value="pieces" onChange={onChange} id="test" />)

    await userEvent.click(screen.getByRole('tab', { name: 'Pieces' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('should render a tablist container', () => {
    render(<ViewToggle options={options} value="pieces" onChange={() => {}} id="test" />)

    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('should have aria-controls on each tab pointing to its panel', () => {
    render(<ViewToggle options={options} value="pieces" onChange={() => {}} id="test" />)

    const piecesTab = screen.getByRole('tab', { name: 'Pieces' })
    const artistsTab = screen.getByRole('tab', { name: 'Artists' })
    expect(piecesTab).toHaveAttribute('aria-controls', 'test-panel-pieces')
    expect(artistsTab).toHaveAttribute('aria-controls', 'test-panel-artists')
  })

  it('should have an id on each tab for aria-labelledby wiring', () => {
    render(<ViewToggle options={options} value="pieces" onChange={() => {}} id="test" />)

    const piecesTab = screen.getByRole('tab', { name: 'Pieces' })
    const artistsTab = screen.getByRole('tab', { name: 'Artists' })
    expect(piecesTab).toHaveAttribute('id', 'test-tab-pieces')
    expect(artistsTab).toHaveAttribute('id', 'test-tab-artists')
  })

  it('should apply data-testid', () => {
    render(
      <ViewToggle
        options={options}
        value="pieces"
        onChange={() => {}}
        id="test"
        data-testid="my-toggle"
      />
    )

    expect(screen.getByTestId('my-toggle')).toBeInTheDocument()
  })
})
