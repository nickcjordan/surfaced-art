import { PortfolioFooter } from '@/components/PortfolioFooter'

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main id="main-content" className="flex-1">{children}</main>
      <PortfolioFooter />
    </div>
  )
}
