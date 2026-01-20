import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const rawResendFrom = process.env.RESEND_FROM || ''

function sanitizeFrom(raw: string) {
  if (!raw) return ''
  let v = raw.trim()
  if (v.includes('=')) {
    const parts = v.split('=')
    v = parts.slice(1).join('=')
  }
  v = v.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
  return v.trim()
}

function isValidFromValue(value: string) {
  if (!value) return false
  const emailMatch = value.match(/<([^>]+)>/) || value.match(/([\w.+-]+@[\w-]+\.[\w.-]+)/)
  if (!emailMatch) return false
  const email = emailMatch[1] || emailMatch[0]
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const RESEND_FROM = sanitizeFrom(rawResendFrom) || 'no-reply@emaus.local'
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

interface EmailNotificationParams {
  to: string[]
  subject: string
  text: string
  html: string
}

export async function sendEmailNotification({ to, subject, text, html }: EmailNotificationParams): Promise<boolean> {
  if (!resendClient) {
    console.warn('[Email] Resend client not configured, skipping email send')
    return false
  }

  if (!isValidFromValue(RESEND_FROM)) {
    console.warn('[Email] RESEND_FROM appears invalid, skipping email send')
    return false
  }

  if (to.length === 0) {
    console.warn('[Email] No recipients provided')
    return false
  }

  try {
    await resendClient.emails.send({
      from: RESEND_FROM,
      to,
      subject,
      text,
      html,
    })
    console.log(`[Email] Sent to: ${to.join(', ')}`)
    return true
  } catch (error) {
    console.error('[Email] Error sending notification:', error)
    return false
  }
}
