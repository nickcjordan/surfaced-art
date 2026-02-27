import { Section, Text } from '@react-email/components'
import { Layout, BRAND } from './components/Layout.js'

export function WaitlistWelcome() {
  return (
    <Layout preview="You're on the list — Surfaced Art">
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
          You're on the List
        </Text>
        <Text style={bodyStyle}>
          Thank you for your interest in Surfaced Art.
        </Text>
        <Text style={bodyStyle}>
          We're building a curated digital gallery for real makers — every
          artist vetted, every piece handmade. No AI. No drop shipping. No mass
          production.
        </Text>
        <Text style={bodyStyle}>
          We'll let you know when Surfaced Art opens to collectors.
        </Text>
        <Text style={bodyStyle}>
          Until then,
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
