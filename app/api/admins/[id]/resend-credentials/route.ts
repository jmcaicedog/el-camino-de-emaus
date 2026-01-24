import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendEmailNotification } from "@/lib/email/send-notification"

// Función para generar contraseña temporal segura
function generateTemporaryPassword(): string {
  const length = 12
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is super admin
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    if (!currentUser) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })

    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle()
    
    const isSuper = !!adminRecord?.is_super
    if (!isSuper) return NextResponse.json({ message: 'No autorizado' }, { status: 403 })

    // Get admin info
    const { data: targetAdmin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, nombre_completo, email')
      .eq('id', id)
      .single()

    if (adminError || !targetAdmin) {
      return NextResponse.json({ message: 'Administrador no encontrado' }, { status: 404 })
    }

    // Generate new temporary password
    const temporaryPassword = generateTemporaryPassword()

    // Create admin client for auth operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ message: 'Configuración del servidor incompleta' }, { status: 500 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Update password in auth
    const { error: updateError } = await adminClient.auth.admin.updateUserById(id, {
      password: temporaryPassword
    })

    if (updateError) {
      console.error("[API] Error updating password:", updateError)
      return NextResponse.json({ message: `Error al actualizar contraseña: ${updateError.message}` }, { status: 400 })
    }

    // Send credentials via email
    const loginUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const subject = 'Nuevas Credenciales de Acceso - El Camino de Emaús'
    const text = `Hola ${targetAdmin.nombre_completo},\n\nSe han generado nuevas credenciales de acceso para tu cuenta de administrador en la plataforma El Camino de Emaús.\n\nTus credenciales de acceso son:\n\nUsuario: ${targetAdmin.email}\nContraseña temporal: ${temporaryPassword}\n\nAccede a la plataforma en: ${loginUrl}/auth/login\n\nPor seguridad, te recomendamos cambiar tu contraseña después del inicio de sesión.\n\n¡Bendiciones!\nEquipo El Camino de Emaús`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nuevas Credenciales de Acceso</h2>
        <p>Hola <strong>${targetAdmin.nombre_completo}</strong>,</p>
        <p>Se han generado nuevas credenciales de acceso para tu cuenta de administrador en la plataforma El Camino de Emaús.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Tus credenciales de acceso:</h3>
          <p style="margin: 10px 0;"><strong>Usuario:</strong> ${targetAdmin.email}</p>
          <p style="margin: 10px 0;"><strong>Contraseña temporal:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
        </div>

        <p>
          <a href="${loginUrl}/auth/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            Acceder a la plataforma
          </a>
        </p>

        <p style="color: #6b7280; font-size: 14px;">
          <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después del inicio de sesión.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          ¡Bendiciones!<br>
          Equipo El Camino de Emaús
        </p>
      </div>
    `

    await sendEmailNotification({ 
      to: [targetAdmin.email], 
      subject, 
      text, 
      html,
      includeSuperAdmins: false // No enviar copia a superadmins en reenvíos
    })

    return NextResponse.json({ message: 'Credenciales reenviadas exitosamente' }, { status: 200 })
  } catch (error) {
    console.error("[API] Error in POST /api/admins/[id]/resend-credentials:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
