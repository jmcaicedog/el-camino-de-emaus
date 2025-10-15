import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, nombreCompleto, token } = body

    if (!userId || !token) {
      return NextResponse.json({ message: 'Faltan datos' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check token exists and unused
    const { data: inviteData, error: inviteError } = await supabase
      .from('admin_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !inviteData) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    if (inviteData.used) {
      return NextResponse.json({ message: 'Token ya fue usado' }, { status: 410 })
    }

    // Create admin user record
    const { error: insertError } = await supabase.from('admin_users').insert({
      id: userId,
      nombre_completo: nombreCompleto,
      role: 'admin',
    })

    if (insertError) {
      console.error('[v0] Error inserting admin user:', insertError)
      return NextResponse.json({ message: insertError.message }, { status: 400 })
    }

    // Mark invite used
    const { error: markError } = await supabase
      .from('admin_invites')
      .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
      .eq('token', token)

    if (markError) {
      console.error('[v0] Error marking invite used:', markError)
    }

    return NextResponse.json({ message: 'Admin creado' }, { status: 200 })
  } catch (e) {
    console.error('[v0] Error in /api/admins/create:', e)
    return NextResponse.json({ message: 'Error del servidor' }, { status: 500 })
  }
}
