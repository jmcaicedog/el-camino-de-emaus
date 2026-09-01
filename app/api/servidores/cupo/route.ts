import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { isServidorRegistrationOpen } from "@/lib/servidores-capacity"
import { getRetiroSettings } from "@/lib/retiro-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { count, error } = await supabase.from("servidores").select("id", { count: "exact", head: true })

    if (error) {
      console.error("[v0] Error fetching servidores capacity:", error)
      return NextResponse.json({ message: "No fue posible consultar el cupo" }, { status: 500 })
    }

    const currentCount = count ?? 0
    const settings = await getRetiroSettings()

    return NextResponse.json(
      {
        currentCount,
        maxCupo: settings.max_servidores,
        registrationOpen: isServidorRegistrationOpen(currentCount, settings.max_servidores),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error in GET /api/servidores/cupo:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
