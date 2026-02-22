import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif-display',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
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
    <html lang="en">
      <body
        className={`${dmSerifDisplay.variable} ${dmSans.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-8 md:py-12">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  )
}
