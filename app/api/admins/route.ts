import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    return NextResponse.json(admins, { status: 200 })
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

    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', servidor.id)
      .maybeSingle()

    if (existingAdmin) {
      return NextResponse.json({ message: 'Este servidor ya es administrador' }, { status: 400 })
    }

    // Create admin user record
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: servidor.id,
        nombre_completo: servidor.nombre_completo,
        email: servidor.correo,
        role: 'admin',
        is_super: false
      })
      .select()
      .single()

    if (insertError) {
      console.error("[API] Error creating admin:", insertError)
      return NextResponse.json({ message: insertError.message }, { status: 400 })
    }

    return NextResponse.json(newAdmin, { status: 201 })
  } catch (error) {
    console.error("[API] Error in POST /api/admins:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
