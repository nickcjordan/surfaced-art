import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
  Link,
} from '@react-email/components'
import type { ReactNode } from 'react'

/** Brand constants for email templates — inlined values, not CSS vars. */
export const BRAND = {
  colors: {
    background: '#FAF9F7',
    text: '#1A1A1A',
    muted: '#6B6560',
    accent: '#2C2926',
    accentHover: '#1A1816',
    border: '#E0DBD6',
    success: '#6B8F6B',
  },
  fonts: {
    heading: "Georgia, 'Times New Roman', Times, serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  siteUrl: 'https://surfaced.art',
} as const

interface LayoutProps {
  preview: string
  children: ReactNode
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: BRAND.colors.background,
          fontFamily: BRAND.fonts.body,
          color: BRAND.colors.text,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px 24px',
          }}
        >
          {/* Header wordmark */}
          <Section style={{ textAlign: 'center' as const, marginBottom: '32px' }}>
            <Text
              style={{
                fontFamily: BRAND.fonts.heading,
                fontSize: '24px',
                letterSpacing: '0.1em',
                color: BRAND.colors.text,
                margin: 0,
              }}
            >
              SURFACED ART
            </Text>
          </Section>

          {/* Email body */}
          {children}

          {/* Footer */}
          <Hr
            style={{
              borderColor: BRAND.colors.border,
              borderTop: `1px solid ${BRAND.colors.border}`,
              margin: '32px 0',
            }}
          />
          <Section style={{ textAlign: 'center' as const }}>
            <Text
              style={{
                color: BRAND.colors.muted,
                fontSize: '12px',
                lineHeight: '1.5',
                margin: '0 0 4px 0',
              }}
            >
              Curated handmade art from vetted artists.
            </Text>
            <Link
              href={BRAND.siteUrl}
              style={{
                color: BRAND.colors.muted,
                fontSize: '12px',
                textDecoration: 'none',
              }}
            >
              surfaced.art
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
