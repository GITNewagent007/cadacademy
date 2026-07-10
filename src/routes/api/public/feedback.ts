import * as React from 'react'
import { render } from '@react-email/render'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'cadacademy'
const SENDER_DOMAIN = 'notify.cadacademy.app'
const FROM_DOMAIN = 'notify.cadacademy.app'
const TEMPLATE_NAME = 'feedback-report'

const bodySchema = z.object({
  issueType: z.string().min(1).max(64),
  description: z.string().min(1).max(4000),
  pageUrl: z.string().max(2048).nullable().optional(),
})

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
  }
}

export const Route = createFileRoute('/api/public/feedback')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500, headers: corsHeaders() })
        }

        let parsed
        try {
          parsed = bodySchema.parse(await request.json())
        } catch (e: any) {
          return Response.json({ error: 'Invalid payload', details: e?.message }, { status: 400, headers: corsHeaders() })
        }

        const supabase = createClient(supabaseUrl, serviceKey)

        // Try to identify caller (optional)
        let userId: string | null = null
        let userEmail: string | null = null
        const authHeader = request.headers.get('Authorization')
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.slice(7).trim()
          const { data } = await supabase.auth.getUser(token)
          if (data?.user) {
            userId = data.user.id
            userEmail = data.user.email ?? null
          }
        }

        // Insert feedback report
        const { error: insertError } = await supabase.from('feedback_reports').insert({
          issue_type: parsed.issueType,
          description: parsed.description,
          page_url: parsed.pageUrl ?? null,
          user_id: userId,
        })
        if (insertError) {
          console.error('feedback insert failed', insertError)
          return Response.json({ error: 'Failed to save report' }, { status: 500, headers: corsHeaders() })
        }

        // Render + enqueue email to fixed recipient
        const template = TEMPLATES[TEMPLATE_NAME]
        if (!template || !template.to) {
          return Response.json({ ok: true, emailed: false }, { headers: corsHeaders() })
        }

        const recipient = template.to
        const normalizedEmail = recipient.toLowerCase()
        const messageId = crypto.randomUUID()

        const templateData = {
          issueType: parsed.issueType,
          description: parsed.description,
          pageUrl: parsed.pageUrl ?? '',
          userEmail,
          userId,
          submittedAt: new Date().toISOString(),
        }

        // Ensure unsubscribe token exists (required by queue processor)
        let unsubscribeToken: string
        const { data: existingToken } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token, used_at')
          .eq('email', normalizedEmail)
          .maybeSingle()
        if (existingToken?.token && !existingToken.used_at) {
          unsubscribeToken = existingToken.token
        } else {
          unsubscribeToken = generateToken()
          await supabase
            .from('email_unsubscribe_tokens')
            .upsert(
              { token: unsubscribeToken, email: normalizedEmail },
              { onConflict: 'email', ignoreDuplicates: true },
            )
          const { data: stored } = await supabase
            .from('email_unsubscribe_tokens')
            .select('token')
            .eq('email', normalizedEmail)
            .maybeSingle()
          if (stored?.token) unsubscribeToken = stored.token
        }

        const element = React.createElement(template.component, templateData)
        const html = await render(element)
        const text = await render(element, { plainText: true })
        const subject =
          typeof template.subject === 'function' ? template.subject(templateData) : template.subject

        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: TEMPLATE_NAME,
          recipient_email: recipient,
          status: 'pending',
        })

        const { error: enqueueError } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: 'transactional',
            label: TEMPLATE_NAME,
            idempotency_key: messageId,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqueueError) {
          console.error('feedback enqueue failed', enqueueError)
          await supabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: TEMPLATE_NAME,
            recipient_email: recipient,
            status: 'failed',
            error_message: 'Failed to enqueue email',
          })
          return Response.json({ ok: true, emailed: false }, { headers: corsHeaders() })
        }

        return Response.json({ ok: true, emailed: true }, { headers: corsHeaders() })
      },
    },
  },
})
