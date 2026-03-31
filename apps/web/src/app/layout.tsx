import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Josefin_Sans, DM_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth'
import { AnalyticsProvider, PostHogPageView } from '@/lib/analytics'
import { SITE_URL } from '@/lib/site-config'
import './globals.css'

const josefinSans = Josefin_Sans({
  variable: '--font-heading',
  weight: ['300', '400', '500', '600', '700'],
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
  metadataBase: new URL(SITE_URL),
  title: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
  description:
    'Discover handmade art from vetted artists. Ceramics, drawing & painting, printmaking & photography, and mixed media & 3D.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Surfaced Art — A Curated Digital Gallery for Real Makers',
    description:
      'Discover handmade art from vetted artists. Ceramics, drawing & painting, printmaking & photography, and mixed media & 3D.',
    type: 'website',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@surfacedart',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${josefinSans.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AnalyticsProvider>
              <Suspense fallback={null}>
                <PostHogPageView />
              </Suspense>
              {children}
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
