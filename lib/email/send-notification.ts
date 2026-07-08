import { Resend } from 'resend'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const rawResendFrom = process.env.RESEND_FROM || ''
const rawFallbackRecipients = process.env.ADMIN_NOTIFICATION_EMAILS || process.env.NOTIFICATION_EMAILS || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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

function parseRecipients(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter((email) => !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}

const fallbackRecipients = parseRecipients(rawFallbackRecipients)

interface EmailNotificationParams {
  to: string[]
  subject: string
  text: string
  html: string
  includeSuperAdmins?: boolean // Nueva opción para incluir superadmins
}

/**
 * Obtiene los correos de todos los superadministradores
 */
async function getSuperAdminEmails(): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Email] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; cannot fetch super admins')
    return []
  }

  try {
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: superAdmins } = await supabase
      .from('admin_users')
      .select('email')
      .eq('is_super', true)

    return superAdmins?.map((admin) => admin.email).filter(Boolean) || []
  } catch (error) {
    console.error('[Email] Error fetching super admin emails:', error)
    return []
  }
}

export async function sendEmailNotification({ 
  to, 
  subject, 
  text, 
  html,
  includeSuperAdmins = true 
}: EmailNotificationParams): Promise<boolean> {
  if (!resendClient) {
    console.warn('[Email] Resend client not configured, skipping email send')
    return false
  }

  if (!isValidFromValue(RESEND_FROM)) {
    console.warn('[Email] RESEND_FROM appears invalid, skipping email send')
    return false
  }

  // Combinar destinatarios originales con superadmins si se solicita
  let allRecipients = [...to]
  
  if (includeSuperAdmins) {
    const superAdminEmails = await getSuperAdminEmails()
    allRecipients = [...new Set([...allRecipients, ...superAdminEmails, ...fallbackRecipients])] // Eliminar duplicados
  }

  if (allRecipients.length === 0) {
    console.warn('[Email] No recipients provided. Configure at least one superadmin email or ADMIN_NOTIFICATION_EMAILS')
    return false
  }

  try {
    const result = await resendClient.emails.send({
      from: RESEND_FROM,
      to: allRecipients,
      subject,
      text,
      html,
    })

    if (result?.error) {
      console.error('[Email] Resend API returned error:', result.error)
      return false
    }

    if (!result?.data?.id) {
      console.warn('[Email] Resend response missing message id; treating as failed send')
      return false
    }

    console.log(`[Email] Resend message id: ${result.data.id}`)
    console.log(`[Email] Sent to: ${allRecipients.join(', ')}`)
    return true
  } catch (error) {
    console.error('[Email] Error sending notification:', error)
    return false
  }
}
