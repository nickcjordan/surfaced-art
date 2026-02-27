import { Section, Text } from '@react-email/components'
import { Layout, BRAND } from './components/Layout.js'

export interface ArtistApplicationConfirmationProps {
  artistName: string
}

export function ArtistApplicationConfirmation({
  artistName,
}: ArtistApplicationConfirmationProps) {
  return (
    <Layout preview={`Thank you for applying to Surfaced Art, ${artistName}`}>
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
          We Received Your Application
        </Text>
        <Text style={bodyStyle}>Dear {artistName},</Text>
        <Text style={bodyStyle}>
          Thank you for your interest in joining Surfaced Art. We have received
          your application and our curatorial team will review it carefully.
        </Text>
        <Text style={bodyStyle}>
          Every artist on Surfaced Art is personally vetted. We review
          applications on a rolling basis, typically within 5–7 business days.
          We'll notify you by email as soon as a decision has been made.
        </Text>
        <Text style={{ ...bodyStyle, color: BRAND.colors.muted }}>
          In the meantime, feel free to explore our current collection at
          surfacedart.com.
        </Text>
        <Text style={bodyStyle}>
          Warmly,
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
