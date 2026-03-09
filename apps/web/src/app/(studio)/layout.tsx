import { StudioFooter } from '@/components/StudioFooter'

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
      <StudioFooter />
    </div>
  )
}
