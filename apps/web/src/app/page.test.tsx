import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('should render the Surfaced Art heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Surfaced Art')
  })

  it('should render the tagline', () => {
    render(<Home />)
    expect(screen.getByText('A curated digital gallery for real makers')).toBeInTheDocument()
  })

  it('should render coming soon message', () => {
    render(<Home />)
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })
})
