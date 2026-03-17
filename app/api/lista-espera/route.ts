import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { isCaminanteRegistrationOpen } from "@/lib/caminantes-capacity"

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nombre_completo = normalizeText(body?.nombre_completo)
    const celular = normalizeText(body?.celular)
    const correo = normalizeText(body?.correo).toLowerCase()

    if (!nombre_completo || !celular || !correo) {
      return NextResponse.json(
        { message: "Nombre, teléfono y correo son obligatorios para la lista de espera" },
        { status: 400 },
      )
    }

    if (!isValidEmail(correo)) {
      return NextResponse.json({ message: "Correo electrónico inválido" }, { status: 400 })
    }

    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { count, error: countError } = await supabase.from("caminantes").select("id", { count: "exact", head: true })

    if (countError) {
      console.error("[v0] Error counting caminantes for waitlist:", countError)
      return NextResponse.json({ message: "No fue posible validar el cupo disponible" }, { status: 500 })
    }

    const currentCount = count ?? 0
    if (isCaminanteRegistrationOpen(currentCount)) {
      return NextResponse.json(
        { message: "Aún hay cupos disponibles. Por favor completa el formulario de caminantes." },
        { status: 409 },
      )
    }

    const { data: existingEmail } = await supabase
      .from("lista_espera")
      .select("id")
      .eq("correo", correo)
      .maybeSingle()

    if (existingEmail) {
      return NextResponse.json({ message: "Este correo ya está registrado en lista de espera" }, { status: 409 })
    }

    const { data, error } = await supabase
      .from("lista_espera")
      .insert([{ nombre_completo, celular, correo }])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error inserting lista_espera:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/lista-espera:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("lista_espera").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching lista_espera:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/lista-espera:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
