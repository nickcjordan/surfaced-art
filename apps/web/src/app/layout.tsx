import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Container } from '@/components/ui/container'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
  description:
    'Discover handmade art from vetted artists. Ceramics, painting, print, jewelry, illustration, photography, woodworking, fibers, and mixed media.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <main className="flex-1">
            <Container className="py-8 md:py-12">
              {children}
            </Container>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
