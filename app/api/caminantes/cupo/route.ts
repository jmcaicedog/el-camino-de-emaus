import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { MAX_CAMINANTES, isCaminanteRegistrationOpen } from "@/lib/caminantes-capacity"

export async function GET() {
  try {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { count, error } = await supabase.from("caminantes").select("id", { count: "exact", head: true })

    if (error) {
      console.error("[v0] Error fetching caminantes capacity:", error)
      return NextResponse.json({ message: "No fue posible consultar el cupo" }, { status: 500 })
    }

    const currentCount = count ?? 0

    return NextResponse.json(
      {
        currentCount,
        maxCupo: MAX_CAMINANTES,
        registrationOpen: isCaminanteRegistrationOpen(currentCount),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error in GET /api/caminantes/cupo:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
