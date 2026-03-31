import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function POST(_request: NextRequest) {
  try {
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

    const service = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error: relError } = await service.from("servidor_equipo").delete().not("id", "is", null)
    if (relError) throw relError

    const { error: servidoresError } = await service.from("servidores").delete().not("id", "is", null)
    if (servidoresError) throw servidoresError

    const { error: caminantesError } = await service.from("caminantes").delete().not("id", "is", null)
    if (caminantesError) throw caminantesError

    return NextResponse.json({ message: "Hard reset ejecutado correctamente" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in POST /api/retiro-settings/hard-reset:", error)
    return NextResponse.json({ message: "Error al ejecutar hard reset" }, { status: 500 })
  }
}
