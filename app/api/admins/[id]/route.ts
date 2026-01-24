import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Prevent deleting yourself
    if (id === currentUser.id) {
      return NextResponse.json({ message: 'No puedes eliminar tu propio acceso de administrador' }, { status: 400 })
    }

    // Check if trying to delete another super admin
    const { data: targetAdmin } = await supabase
      .from('admin_users')
      .select('is_super')
      .eq('id', id)
      .single()

    if (targetAdmin?.is_super) {
      return NextResponse.json({ message: 'No puedes eliminar el acceso de un super administrador' }, { status: 403 })
    }

    // Delete admin user
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("[API] Error deleting admin:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Administrador eliminado exitosamente' }, { status: 200 })
  } catch (error) {
    console.error("[API] Error in DELETE /api/admins/[id]:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
