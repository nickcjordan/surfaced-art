import { Section, Text } from '@react-email/components'
import { Layout, BRAND } from './components/Layout.js'

export interface AdminApplicationNotificationProps {
  artistName: string
  artistEmail: string
  categories: string[]
  applicationDate: string
}

export function AdminApplicationNotification({
  artistName,
  artistEmail,
  categories,
  applicationDate,
}: AdminApplicationNotificationProps) {
  return (
    <Layout preview={`New artist application from ${artistName}`}>
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
          New Artist Application
        </Text>

        <Text style={labelStyle}>Name</Text>
        <Text style={valueStyle}>{artistName}</Text>

        <Text style={labelStyle}>Email</Text>
        <Text style={valueStyle}>{artistEmail}</Text>

        <Text style={labelStyle}>Categories</Text>
        <Text style={valueStyle}>{categories.join(', ')}</Text>

        <Text style={labelStyle}>Submitted</Text>
        <Text style={valueStyle}>{applicationDate}</Text>
      </Section>
    </Layout>
  )
}

const labelStyle = {
  fontFamily: BRAND.fonts.body,
  fontSize: '12px',
  lineHeight: '1.4',
  color: BRAND.colors.muted,
  margin: '16px 0 2px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const valueStyle = {
  fontFamily: BRAND.fonts.body,
  fontSize: '16px',
  lineHeight: '1.5',
  color: BRAND.colors.text,
  margin: '0 0 8px 0',
}
