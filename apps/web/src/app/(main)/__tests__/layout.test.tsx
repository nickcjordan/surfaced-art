import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MainLayout from '../layout'

vi.mock('@/components/Header', () => ({
  Header: () => <header data-testid="site-header">Header</header>,
}))
vi.mock('@/components/Footer', () => ({
  Footer: () => <footer data-testid="site-footer">Footer</footer>,
}))
vi.mock('@/components/ScrollToTop', () => ({
  ScrollToTop: () => null,
}))
vi.mock('@/components/CookieConsent', () => ({
  CookieConsent: () => null,
}))

describe('MainLayout', () => {
  it('should render main element with id="main-content" for skip-to-content', () => {
    render(
      <MainLayout>
        <p>Page content</p>
      </MainLayout>
    )
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')
  })
})
