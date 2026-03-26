import { Section, Text } from '@react-email/components'
import { Layout, BRAND } from './components/Layout.js'

export interface ArtistContactMessageProps {
  artistName: string
  senderFirstName: string
  senderLastName: string
  senderEmail: string
  subject: string
  message: string
}

export function ArtistContactMessage({
  artistName,
  senderFirstName,
  senderLastName,
  senderEmail,
  subject,
  message,
}: ArtistContactMessageProps) {
  return (
    <Layout preview={`New message from ${senderFirstName} ${senderLastName}`}>
      <Section>
        <Text style={headingStyle}>New Message</Text>
        <Text style={bodyStyle}>
          Hi {artistName},
        </Text>
        <Text style={bodyStyle}>
          You received a message through your Surfaced Art portfolio.
        </Text>

        {/* Sender details */}
        <Section
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${BRAND.colors.border}`,
            borderRadius: '6px',
            padding: '16px 20px',
            margin: '24px 0',
          }}
        >
          <Text style={detailLabelStyle}>From</Text>
          <Text style={detailValueStyle}>{senderFirstName} {senderLastName} ({senderEmail})</Text>
          <Text style={{ ...detailLabelStyle, marginTop: '12px' }}>Subject</Text>
          <Text style={detailValueStyle}>{subject}</Text>
        </Section>

        {/* Message content */}
        <Section
          style={{
            borderLeft: `3px solid ${BRAND.colors.border}`,
            paddingLeft: '16px',
            margin: '24px 0',
          }}
        >
          <Text
            style={{
              ...bodyStyle,
              whiteSpace: 'pre-line' as const,
            }}
          >
            {message}
          </Text>
        </Section>

        <Text style={bodyStyle}>
          Reply directly to this email to respond to {senderFirstName}.
        </Text>
        <Text style={mutedStyle}>
          This message was sent through surfaced.art. If you believe this is
          spam, please contact support@surfaced.art.
        </Text>
      </Section>
    </Layout>
  )
}

const headingStyle = {
  fontFamily: BRAND.fonts.heading,
  fontSize: '28px',
  lineHeight: '1.2',
  color: BRAND.colors.text,
  margin: '0 0 24px 0',
}

const bodyStyle = {
  fontFamily: BRAND.fonts.body,
  fontSize: '16px',
  lineHeight: '1.65',
  color: BRAND.colors.text,
  margin: '0 0 16px 0',
}

const mutedStyle = {
  fontFamily: BRAND.fonts.body,
  fontSize: '13px',
  lineHeight: '1.5',
  color: BRAND.colors.muted,
  margin: '24px 0 0 0',
}

const detailLabelStyle = {
  fontFamily: BRAND.fonts.body,
  fontSize: '12px',
  lineHeight: '1.2',
  color: BRAND.colors.muted,
  margin: '0 0 2px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const detailValueStyle = {
  fontFamily: BRAND.fonts.body,
  fontSize: '15px',
  lineHeight: '1.4',
  color: BRAND.colors.text,
  margin: '0',
}
