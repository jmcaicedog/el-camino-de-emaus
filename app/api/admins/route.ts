import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { getPublicSiteUrl } from "@/lib/site-url"

const RETREAT_COORDINATOR_TEAM_NAME = "Coordinador del retiro"

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

export async function GET(request: NextRequest) {
  try {
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

    // Get all admin users with additional info
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        nombre_completo,
        role,
        email,
        is_super,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("[API] Error fetching admins:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    const adminIds = (admins || []).map((admin) => admin.id)

    const { data: servidores } = await supabase
      .from('servidores')
      .select('auth_user_id, celular, imagen')
      .in('auth_user_id', adminIds)

    const servidorByAuthId = new Map<string, { celular?: string | null; imagen?: string | null }>()
    ;(servidores || []).forEach((servidor) => {
      if (servidor.auth_user_id) {
        servidorByAuthId.set(servidor.auth_user_id, {
          celular: servidor.celular,
          imagen: servidor.imagen,
        })
      }
    })

    const adminsWithContact = (admins || []).map((admin) => ({
      ...admin,
      celular: servidorByAuthId.get(admin.id)?.celular || null,
      imagen: servidorByAuthId.get(admin.id)?.imagen || null,
    }))

    return NextResponse.json(adminsWithContact, { status: 200 })
  } catch (error) {
    console.error("[API] Error in GET /api/admins:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { servidor_id } = body

    if (!servidor_id) {
      return NextResponse.json({ message: 'servidor_id es requerido' }, { status: 400 })
    }

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

    // Get servidor info
    const { data: servidor, error: servidorError } = await supabase
      .from('servidores')
      .select('id, nombre_completo, correo, auth_user_id')
      .eq('id', servidor_id)
      .single()

    if (servidorError || !servidor) {
      return NextResponse.json({ message: 'Servidor no encontrado' }, { status: 404 })
    }

    const { data: servidorEquipos, error: equiposError } = await supabase
      .from('servidor_equipo')
      .select('equipos(nombre)')
      .eq('servidor_id', servidor_id)

    if (equiposError) {
      console.error("[API] Error fetching servidor teams:", equiposError)
      return NextResponse.json({ message: 'No fue posible validar los equipos del servidor' }, { status: 400 })
    }

    const isRetreatCoordinator =
      servidorEquipos?.some((relation: any) => relation.equipos?.nombre === RETREAT_COORDINATOR_TEAM_NAME) ?? false

    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', servidor.id)
      .maybeSingle()

    if (existingAdmin) {
      return NextResponse.json({ message: 'Este servidor ya es administrador' }, { status: 400 })
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword()

    // Create admin client for auth operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ message: 'Configuración del servidor incompleta' }, { status: 500 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Check if user already exists in auth by email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users?.find(u => u.email === servidor.correo)

    let authUserId: string
    let isNewUser = false

    if (existingAuthUser) {
      // User already exists in auth, use that ID and update password
      authUserId = existingAuthUser.id
      const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          nombre_completo: servidor.nombre_completo,
          role: isRetreatCoordinator ? 'superadmin' : 'admin'
        }
      })
      if (updateError) {
        console.error("[API] Error updating existing auth user:", updateError)
        return NextResponse.json({ message: `Error al actualizar usuario: ${updateError.message}` }, { status: 400 })
      }
    } else {
      // Create new auth user account
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: servidor.correo,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          nombre_completo: servidor.nombre_completo,
          role: isRetreatCoordinator ? 'superadmin' : 'admin'
        }
      })

      if (authError) {
        console.error("[API] Error creating auth user:", authError)
        return NextResponse.json({ message: `Error al crear cuenta: ${authError.message}` }, { status: 400 })
      }

      authUserId = authData.user.id
      isNewUser = true
    }

    // Check if this authUserId is already an admin
    const { data: existingAdminById } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', authUserId)
      .maybeSingle()

    if (existingAdminById) {
      // This auth user is already registered as admin
      return NextResponse.json({ 
        message: 'Este usuario ya tiene permisos de administrador' 
      }, { status: 400 })
    }

    // Create admin user record using the auth user's ID
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authUserId,
        nombre_completo: servidor.nombre_completo,
        email: servidor.correo,
        role: 'admin',
        is_super: isRetreatCoordinator
      })
      .select()
      .single()

    if (insertError) {
      console.error("[API] Error creating admin:", insertError)
      // Rollback: delete auth user only if we just created it
      if (isNewUser) {
        await adminClient.auth.admin.deleteUser(authUserId)
      }
      return NextResponse.json({ message: insertError.message }, { status: 400 })
    }

    // Update servidor record with auth_user_id
    await supabase
      .from('servidores')
      .update({ auth_user_id: authUserId })
      .eq('id', servidor.id)

    // Send credentials via email
    const loginUrl = getPublicSiteUrl(request)
    const accessRoleLabel = isRetreatCoordinator ? 'Superadministrador' : 'Administrador'
    const subject = 'Credenciales de Acceso - El Camino de Emaús'
    const text = `Hola ${servidor.nombre_completo},\n\nHas sido promovido a ${accessRoleLabel} en la plataforma El Camino de Emaús.\n\nTus credenciales de acceso son:\n\nUsuario: ${servidor.correo}\nContraseña temporal: ${temporaryPassword}\n\nAccede a la plataforma en: ${loginUrl}/auth/login\n\nPor seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.\n\n¡Bendiciones!\nEquipo El Camino de Emaús`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Credenciales de Acceso</h2>
        <p>Hola <strong>${servidor.nombre_completo}</strong>,</p>
        <p>Has sido promovido a <strong>${accessRoleLabel}</strong> en la plataforma El Camino de Emaús.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Tus credenciales de acceso:</h3>
          <p style="margin: 10px 0;"><strong>Usuario:</strong> ${servidor.correo}</p>
          <p style="margin: 10px 0;"><strong>Contraseña temporal:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
        </div>

        <p>
          <a href="${loginUrl}/auth/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            Acceder a la plataforma
          </a>
        </p>

        <p style="color: #6b7280; font-size: 14px;">
          <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          ¡Bendiciones!<br>
          Equipo El Camino de Emaús
        </p>
      </div>
    `

    await sendEmailNotification({ 
      to: [servidor.correo], 
      subject, 
      text, 
      html,
      includeSuperAdmins: true // Los superadmins también reciben copia
    })

    return NextResponse.json({ ...newAdmin, is_super: isRetreatCoordinator }, { status: 201 })
  } catch (error) {
    console.error("[API] Error in POST /api/admins:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
