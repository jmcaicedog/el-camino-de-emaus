import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { isCaminanteRegistrationOpen } from "@/lib/caminantes-capacity"
import { formatPersonName } from "@/lib/utils"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { getRetiroSettings } from "@/lib/retiro-settings"

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nombre_completo = formatPersonName(normalizeText(body?.nombre_completo))
    const celular = normalizeText(body?.celular)
    const correo = normalizeText(body?.correo).toLowerCase()
    const formData = body && typeof body === "object" ? body : {}

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
    const settings = await getRetiroSettings()
    if (isCaminanteRegistrationOpen(currentCount, settings.max_caminantes)) {
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
      .insert([
        {
          nombre_completo,
          celular,
          correo,
          form_data: {
            ...formData,
            nombre_completo,
            celular,
            correo,
          },
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error inserting lista_espera:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Enviar notificación a superadmins sobre nuevo registro en lista de espera
    const subject = "Nuevo registro en lista de espera"
    const text = `Se registró una nueva persona en la lista de espera.\n\nNombre: ${data.nombre_completo}\nCelular: ${data.celular}\nCorreo: ${data.correo}\n\nRevisa la plataforma para más detalles.`
    const html = `
      <h2>Nuevo registro en lista de espera</h2>
      <p>Se registró una nueva persona en la lista de espera:</p>
      <ul>
        <li><strong>Nombre:</strong> ${data.nombre_completo}</li>
        <li><strong>Celular:</strong> ${data.celular}</li>
        <li><strong>Correo:</strong> ${data.correo}</li>
      </ul>
      <p>Revisa la plataforma para más detalles.</p>
    `

    await sendEmailNotification({ to: [], subject, text, html })

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

    const normalized = (data || []).map((item) => ({
      ...item,
      nombre_completo: formatPersonName(item.nombre_completo),
    }))

    return NextResponse.json(normalized, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/lista-espera:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
