import { type NextRequest, NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "@/app/api/alojamiento/utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const habitacionId = typeof body?.habitacion_id === "string" ? body.habitacion_id : ""
    const personaId = typeof body?.persona_id === "string" ? body.persona_id : ""
    const personaTipo = body?.persona_tipo === "caminante" || body?.persona_tipo === "servidor" ? body.persona_tipo : null
    const camaNumero = Number(body?.cama_numero)

    if (!habitacionId || !personaId || !personaTipo) {
      return NextResponse.json({ message: "Faltan datos para asignar la cama" }, { status: 400 })
    }

    if (!Number.isInteger(camaNumero) || camaNumero < 1) {
      return NextResponse.json({ message: "El número de cama debe ser entero mayor a 0" }, { status: 400 })
    }

    const service = getServiceClient()

    const { data: habitacion, error: habitacionError } = await service
      .from("habitaciones")
      .select("id, camas_total")
      .eq("id", habitacionId)
      .single()

    if (habitacionError || !habitacion) {
      return NextResponse.json({ message: "Habitación no encontrada" }, { status: 404 })
    }

    if (camaNumero > Number(habitacion.camas_total)) {
      return NextResponse.json({ message: "La cama está fuera del rango configurado" }, { status: 400 })
    }

    const table = personaTipo === "caminante" ? "caminantes" : "servidores"
    const { data: persona, error: personaError } = await service.from(table).select("id").eq("id", personaId).maybeSingle()

    if (personaError || !persona) {
      return NextResponse.json({ message: "La persona seleccionada no existe" }, { status: 404 })
    }

    const { data: existingForPerson, error: existingForPersonError } = await service
      .from("asignaciones_alojamiento")
      .select("id")
      .eq("persona_id", personaId)
      .eq("persona_tipo", personaTipo)
      .maybeSingle()

    if (existingForPersonError) {
      return NextResponse.json({ message: existingForPersonError.message }, { status: 400 })
    }

    if (existingForPerson) {
      return NextResponse.json({ message: "La persona ya tiene una cama asignada" }, { status: 409 })
    }

    const { data: existingBed, error: existingBedError } = await service
      .from("asignaciones_alojamiento")
      .select("id")
      .eq("habitacion_id", habitacionId)
      .eq("cama_numero", camaNumero)
      .maybeSingle()

    if (existingBedError) {
      return NextResponse.json({ message: existingBedError.message }, { status: 400 })
    }

    if (existingBed) {
      return NextResponse.json({ message: "La cama seleccionada ya está ocupada" }, { status: 409 })
    }

    const { data, error } = await service
      .from("asignaciones_alojamiento")
      .insert([
        {
          habitacion_id: habitacionId,
          persona_id: personaId,
          persona_tipo: personaTipo,
          cama_numero: camaNumero,
        },
      ])
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/alojamiento/asignaciones:", error)
    return NextResponse.json({ message: "Error al crear asignación" }, { status: 500 })
  }
}
