import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM || 'no-reply@emaus.local'
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

        const subject = 'Invitación para ser administrador en Emaús'
        const text = `Hola,\n\nHas sido invitado a registrarte como administrador en Emaús.\n\nCódigo de invitación: ${token}\n\nRegístrate aquí: ${signupLink}\n\nSi no esperabas esto, ignora este correo.`
        const html = `<p>Hola,</p><p>Has sido invitado a registrarte como <strong>administrador</strong> en Emaús.</p><p><strong>Código de invitación:</strong> <code>${token}</code></p><p>Puedes registrarte aquí: <a href="${signupLink}">${signupLink}</a></p><p>Si no esperabas esto, ignora este correo.</p>`

        await resendClient.emails.send({
          from: RESEND_FROM,
          to: email,
          subject,
          text,
          html,
        })
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
