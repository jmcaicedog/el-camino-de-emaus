import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
// Read raw value and sanitize it: some hosting UIs accidentally include quotes or the whole `KEY="value"` string.
const rawResendFrom = process.env.RESEND_FROM || ''
function sanitizeFrom(raw: string) {
  if (!raw) return ''
  let v = raw.trim()
  // If someone pasted `RESEND_FROM="..."` remove the left side until '='
  if (v.includes('=')) {
    const parts = v.split('=')
    v = parts.slice(1).join('=')
  }
  // Trim wrapping single or double quotes
  v = v.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
  return v.trim()
}

function isValidFromValue(value: string) {
  if (!value) return false
  // Accept formats like: "Name <local@domain.tld>" or just "local@domain.tld"
  // Simple regex to ensure there's at least a valid-looking email somewhere.
  const emailMatch = value.match(/<([^>]+)>/) || value.match(/([\w.+-]+@[\w-]+\.[\w.-]+)/)
  if (!emailMatch) return false
  const email = emailMatch[1] || emailMatch[0]
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const RESEND_FROM = sanitizeFrom(rawResendFrom) || 'no-reply@emaus.local'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000'

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email } = body || {}

    const supabase = await createClient()

    // Get current user from session
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const user = userData?.user

    if (userError || !user) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    }

    // Check admin role
    const { data: adminData } = await supabase.from('admin_users').select('*').eq('id', user.id).single()
    if (!adminData) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 })
    }

    // If email provided, check whether that email already belongs to an admin
    if (email) {
      try {
        // Try to find a matching admin by email in admin_users table (if you store email there)
        const { data: adminByEmail } = await supabase.from('admin_users').select('id,email').eq('email', email).maybeSingle()
        if (adminByEmail) {
          return NextResponse.json({ message: 'Este usuario ya es administrador', alreadyAdmin: true }, { status: 200 })
        }

        // Try to find user id in profiles or servidores table (common places)
        const { data: profile } = await supabase.from('profiles').select('id,email').eq('email', email).maybeSingle()
        let targetUserId = profile?.id || null

        if (!targetUserId) {
          const { data: servidorRow } = await supabase.from('servidores').select('id,correo').eq('correo', email).maybeSingle()
          if (servidorRow?.id) targetUserId = servidorRow.id
        }

        if (targetUserId) {
          const { data: adm } = await supabase.from('admin_users').select('id').eq('id', targetUserId).maybeSingle()
          if (adm) {
            return NextResponse.json({ message: 'Este usuario ya es administrador', alreadyAdmin: true }, { status: 200 })
          }
        }
      } catch (checkErr) {
        console.error('[v0] Error checking admin status for email:', checkErr)
        // continue; failure in the check should not block invite creation
      }
    }

    // Insert invite and record who created it
    const { data: invite, error: insertError } = await supabase
      .from('admin_invites')
      .insert({ created_by: user.id })
      .select()
      .single()

    if (insertError || !invite) {
      console.error('[v0] Error creating invite:', insertError)
      return NextResponse.json({ message: insertError?.message || 'Error creando invitación' }, { status: 400 })
    }

    // If email provided and Resend configured, send the email
    if (email && resendClient) {
      try {
        const token = invite.token
        const signupLink = `${SITE_URL}/auth/signup`

        const subject = 'Invitación para ser administrador en el Retiro de Emaús Cristo Rey'
        const text = `¡Hola!,\n\nHas sido invitado a registrarte como administrador en la plataforma del Retiro de Emaús Cristo Rey.\n\nCódigo de invitación: ${token}\n\nRegístrate aquí: ${signupLink}\n\nSi no esperabas esto, ignora este correo.`
        const html = `<p>Hola,</p><p>Has sido invitado a registrarte como <strong>administrador</strong> en la plataforma del Retiro de Emaús Cristo Rey.</p><p><strong>Código de invitación:</strong> <code>${token}</code></p><p>Puedes registrarte aquí: <a href="${signupLink}">${signupLink}</a></p><p>Si no esperabas esto, ignora este correo.</p>`

        // Validate the configured `from` value. If it's malformed (often caused by
        // accidentally including the env var name or wrapping quotes), don't call the API
        // because Resend will return a 422 validation_error.
        if (!isValidFromValue(RESEND_FROM)) {
          console.warn('[v0] RESEND_FROM appears invalid, skipping Resend send. RESEND_FROM=' + rawResendFrom)
        } else {
          await resendClient.emails.send({
            from: RESEND_FROM,
            to: email,
            subject,
            text,
            html,
          })
        }
      } catch (sendErr) {
        console.error('[v0] Error sending invite email via Resend:', sendErr)
        // We don't block invite creation if email sending fails; it's logged for later inspection.
      }
    }

    return NextResponse.json({ token: invite.token }, { status: 200 })
  } catch (e) {
    console.error('[v0] Error in /api/admins/invite:', e)
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 })
  }
}
