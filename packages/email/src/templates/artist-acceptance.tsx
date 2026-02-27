import { Section, Text, Button } from '@react-email/components'
import { Layout, BRAND } from './components/Layout.js'

export interface ArtistAcceptanceProps {
  artistName: string
}

// TODO(#181): Update this URL to the profile editor when it ships
const PROFILE_SETUP_URL = 'https://surfacedart.com'

export function ArtistAcceptance({ artistName }: ArtistAcceptanceProps) {
  return (
    <Layout preview={`Welcome to Surfaced Art, ${artistName}`}>
      <Section>
        <Text
          style={{
            fontFamily: BRAND.fonts.heading,
            fontSize: '28px',
            lineHeight: '1.2',
            color: BRAND.colors.text,
            margin: '0 0 24px 0',
          }}
        >
          Welcome to Surfaced Art
        </Text>
        <Text style={bodyStyle}>Dear {artistName},</Text>
        <Text style={bodyStyle}>
          We are pleased to welcome you to Surfaced Art.
        </Text>
        <Text style={bodyStyle}>
          After careful review, our curatorial team has selected your work for
          inclusion in our gallery. Every artist on Surfaced Art is personally
          vetted, and we are honored to have you among them.
        </Text>
        <Text style={bodyStyle}>
          Your next step is to set up your artist profile. This is where
          collectors will discover your story, your process, and your available
          work.
        </Text>

        {/* CTA button */}
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button
            href={PROFILE_SETUP_URL}
            style={{
              backgroundColor: BRAND.colors.accent,
              color: '#FFFFFF',
              fontFamily: BRAND.fonts.body,
              fontSize: '16px',
              fontWeight: 500,
              padding: '12px 32px',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Set Up Your Profile
          </Button>
        </Section>

        <Text style={bodyStyle}>
          If you have any questions, reply to this email — we're here to help.
        </Text>
        <Text style={bodyStyle}>
          Welcome aboard,
          <br />
          The Surfaced Art Team
        </Text>
      </Section>
    </Layout>
  )
}

const bodyStyle = {
  fontFamily: BRAND.fonts.body,
  fontSize: '16px',
  lineHeight: '1.65',
  color: BRAND.colors.text,
  margin: '0 0 16px 0',
}
