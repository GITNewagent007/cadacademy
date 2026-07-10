import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  issueType?: string
  description?: string
  pageUrl?: string
  userEmail?: string | null
  userId?: string | null
  submittedAt?: string
}

const Email = ({
  issueType = 'other',
  description = '',
  pageUrl = '',
  userEmail = null,
  userId = null,
  submittedAt = new Date().toISOString(),
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New feedback report: {issueType}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New feedback report</Heading>
        <Section style={card}>
          <Text style={label}>Issue type</Text>
          <Text style={value}>{issueType}</Text>

          <Hr style={hr} />

          <Text style={label}>Description</Text>
          <Text style={{ ...value, whiteSpace: 'pre-wrap' }}>{description}</Text>

          <Hr style={hr} />

          <Text style={label}>Page</Text>
          {pageUrl ? (
            <Link href={pageUrl} style={link}>
              {pageUrl}
            </Link>
          ) : (
            <Text style={value}>—</Text>
          )}

          <Hr style={hr} />

          <Text style={label}>Reported by</Text>
          <Text style={value}>{userEmail || 'Anonymous'}</Text>
          {userId && <Text style={muted}>user id: {userId}</Text>}

          <Hr style={hr} />

          <Text style={muted}>Submitted {submittedAt}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[CAD Academy feedback] ${data.issueType || 'report'}`,
  displayName: 'Feedback report',
  to: 'Liam.g.holt@gmail.com',
  previewData: {
    issueType: 'missing_measurement',
    description: 'The extrude drawing is missing the 25mm depth.',
    pageUrl: 'https://cadacademy.app/learn/inventor/tutorials/practice-problems/queen',
    userEmail: 'student@example.com',
    userId: 'abc-123',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', margin: '0 0 16px' }
const card = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px 20px',
}
const label = {
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: '#6b7280',
  margin: '4px 0 2px',
}
const value = { fontSize: '14px', color: '#111827', margin: '0 0 4px' }
const muted = { fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }
const link = { fontSize: '14px', color: '#2563eb', wordBreak: 'break-all' as const }
const hr = { borderColor: '#e5e7eb', margin: '12px 0' }
