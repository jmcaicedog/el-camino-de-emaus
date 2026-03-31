import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRetiroSettings } from "@/lib/retiro-settings"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    await createClient()

    const service = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const settings = await getRetiroSettings()
    const desiredMesasCount = Math.max(1, Number(settings.mesas_count) || 12)

    const { data: existingMesas, error: existingMesasError } = await service.from("mesas").select("numero")
    if (existingMesasError) {
      console.error("[v0] Error fetching mesas for ensure:", existingMesasError)
      return NextResponse.json({ message: existingMesasError.message }, { status: 400 })
    }

    const existingNumbers = new Set((existingMesas ?? []).map((m) => Number(m.numero)))
    const missingMesas: Array<{ numero: number }> = []
    for (let numero = 1; numero <= desiredMesasCount; numero += 1) {
      if (!existingNumbers.has(numero)) {
        missingMesas.push({ numero })
      }
    }

    if (missingMesas.length > 0) {
      const { error: upsertMesasError } = await service.from("mesas").upsert(missingMesas, { onConflict: "numero" })
      if (upsertMesasError) {
        console.error("[v0] Error creating missing mesas in GET:", upsertMesasError)
        return NextResponse.json({ message: upsertMesasError.message }, { status: 400 })
      }
    }

    const { data, error } = await service.from("mesas").select("*").order("numero", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching mesas:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/mesas:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
