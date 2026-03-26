import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    if (!currentUser) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("is_super")
      .eq("id", currentUser.id)
      .maybeSingle()

    if (!adminRecord?.is_super) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const { error } = await supabase.from("lista_espera").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting waitlist item:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Registro eliminado de lista de espera" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/lista-espera/[id]:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
