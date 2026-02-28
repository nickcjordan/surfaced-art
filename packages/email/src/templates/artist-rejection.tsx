import { Section, Text } from '@react-email/components'
import { Layout, BRAND } from './components/Layout.js'

export interface ArtistRejectionProps {
  artistName: string
}

export function ArtistRejection({ artistName }: ArtistRejectionProps) {
  return (
    <Layout preview="Update on Your Surfaced Art Application">
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
          Application Update
        </Text>
        <Text style={bodyStyle}>Dear {artistName},</Text>
        <Text style={bodyStyle}>
          Thank you for applying to Surfaced Art. We truly appreciate the time
          you took to share your work with us.
        </Text>
        <Text style={bodyStyle}>
          After careful review, our curatorial team has decided not to move
          forward with your application at this time. This does not reflect on
          the quality of your work — our selections are based on the current
          direction and capacity of our gallery.
        </Text>
        <Text style={bodyStyle}>
          We encourage you to continue developing your practice and to
          reapply in the future. Our curatorial needs evolve, and we would
          welcome the opportunity to review your work again.
        </Text>
        <Text style={bodyStyle}>
          If you have any questions, feel free to reply to this email.
        </Text>
        <Text style={bodyStyle}>
          With appreciation,
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
