import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ScrollToTop } from '@/components/ScrollToTop'
import { CookieConsent } from '@/components/CookieConsent'
import { Container } from '@/components/ui/container'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main id="main-content" className="flex-1">
        <Container className="py-8 md:py-12">
          {children}
        </Container>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
