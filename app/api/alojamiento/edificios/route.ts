import { type NextRequest, NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "@/app/api/alojamiento/utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const service = getServiceClient()

    const [edificiosRes, habitacionesRes, asignacionesRes, caminantesRes, servidoresRes] = await Promise.all([
      service.from("edificios").select("*").order("nombre", { ascending: true }),
      service.from("habitaciones").select("*").order("nombre", { ascending: true }),
      service.from("asignaciones_alojamiento").select("*").order("cama_numero", { ascending: true }),
      service
        .from("caminantes")
        .select("id, nombre_completo, ronca_al_dormir, edad")
        .order("nombre_completo", { ascending: true }),
      service
        .from("servidores")
        .select("id, nombre_completo, ronca_al_dormir, edad")
        .order("nombre_completo", { ascending: true }),
    ])

    if (edificiosRes.error || habitacionesRes.error || asignacionesRes.error || caminantesRes.error || servidoresRes.error) {
      const message =
        edificiosRes.error?.message ||
        habitacionesRes.error?.message ||
        asignacionesRes.error?.message ||
        caminantesRes.error?.message ||
        servidoresRes.error?.message ||
        "Error consultando datos de alojamiento"

      return NextResponse.json({ message }, { status: 400 })
    }

    const caminantesMap = new Map((caminantesRes.data || []).map((c) => [c.id, c]))
    const servidoresMap = new Map((servidoresRes.data || []).map((s) => [s.id, s]))

    const asignacionesByHabitacion = new Map<string, any[]>()
    for (const asignacion of asignacionesRes.data || []) {
      const list = asignacionesByHabitacion.get(asignacion.habitacion_id) || []

      const personaData =
        asignacion.persona_tipo === "caminante"
          ? caminantesMap.get(asignacion.persona_id)
          : servidoresMap.get(asignacion.persona_id)

      list.push({
        ...asignacion,
        persona_nombre: personaData?.nombre_completo || "Persona no encontrada",
        ronca_al_dormir: Boolean(personaData?.ronca_al_dormir),
      })
      asignacionesByHabitacion.set(asignacion.habitacion_id, list)
    }

    const habitacionesByEdificio = new Map<string, any[]>()
    for (const habitacion of habitacionesRes.data || []) {
      const list = habitacionesByEdificio.get(habitacion.edificio_id) || []
      list.push({
        ...habitacion,
        asignaciones: (asignacionesByHabitacion.get(habitacion.id) || []).sort((a, b) => a.cama_numero - b.cama_numero),
      })
      habitacionesByEdificio.set(habitacion.edificio_id, list)
    }

    const edificios = (edificiosRes.data || []).map((edificio) => ({
      ...edificio,
      habitaciones: (habitacionesByEdificio.get(edificio.id) || []).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    }))

    const assignedCaminanteIds = new Set(
      (asignacionesRes.data || []).filter((a) => a.persona_tipo === "caminante").map((a) => a.persona_id),
    )
    const assignedServidorIds = new Set(
      (asignacionesRes.data || []).filter((a) => a.persona_tipo === "servidor").map((a) => a.persona_id),
    )

    const caminantesDisponibles = (caminantesRes.data || [])
      .filter((c) => !assignedCaminanteIds.has(c.id))
      .map((c) => ({ ...c, persona_tipo: "caminante" as const }))

    const servidoresDisponibles = (servidoresRes.data || [])
      .filter((s) => !assignedServidorIds.has(s.id))
      .map((s) => ({ ...s, persona_tipo: "servidor" as const }))

    return NextResponse.json(
      {
        edificios,
        personas_disponibles: [...caminantesDisponibles, ...servidoresDisponibles].sort((a, b) =>
          a.nombre_completo.localeCompare(b.nombre_completo, "es"),
        ),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error in GET /api/alojamiento/edificios:", error)
    return NextResponse.json({ message: "Error al consultar alojamiento" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : ""
    const habitacionesCount = Math.max(0, Number(body?.habitaciones_count) || 0)
    const camasPorHabitacion = Math.max(1, Number(body?.camas_por_habitacion) || 1)

    if (!nombre) {
      return NextResponse.json({ message: "El nombre del edificio es obligatorio" }, { status: 400 })
    }

    const service = getServiceClient()

    const { data, error } = await service.from("edificios").insert([{ nombre }]).select("*").single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    if (habitacionesCount > 0) {
      const habitacionesPayload = Array.from({ length: habitacionesCount }, (_, index) => ({
        edificio_id: data.id,
        nombre: `Habitación ${index + 1}`,
        camas_total: camasPorHabitacion,
      }))

      const { error: roomsError } = await service.from("habitaciones").insert(habitacionesPayload)

      if (roomsError) {
        // Intento de rollback para evitar edificio sin configuración inicial solicitada.
        await service.from("edificios").delete().eq("id", data.id)
        return NextResponse.json({ message: roomsError.message }, { status: 400 })
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/alojamiento/edificios:", error)
    return NextResponse.json({ message: "Error al crear edificio" }, { status: 500 })
  }
}
