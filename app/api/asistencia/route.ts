import { NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "./utils"
import type { CaminanteAsistenciaResumen, Mesa } from "@/lib/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const auth = await requireSuperAdmin()
    if ("error" in auth) return auth.error

    const service = getServiceClient()

    const [
      { data: caminantes, error: caminantesErr },
      { data: mesas, error: mesasErr },
      { data: servidores, error: servidoresErr },
      { data: asignaciones, error: asignacionesErr },
      { data: asistencias, error: asistenciasErr },
    ] = await Promise.all([
      service.from("caminantes").select("id, nombre_completo, celular, imagen, mesa_id").order("nombre_completo"),
      service.from("mesas").select("id, numero, nombre, created_at, updated_at").order("numero"),
      service.from("servidores").select("mesa_id, nombre_completo, tipo_servidor").not("mesa_id", "is", null),
      service
        .from("asignaciones_alojamiento")
        .select("persona_id, habitaciones(nombre)")
        .eq("persona_tipo", "caminante"),
      service.from("asistencia_caminantes").select("caminante_id, llego, llegada_at"),
    ])

    if (caminantesErr) throw caminantesErr
    if (mesasErr) throw mesasErr
    if (servidoresErr) throw servidoresErr
    if (asignacionesErr) throw asignacionesErr
    if (asistenciasErr) throw asistenciasErr

    // Build lookup maps
    const mesaMap = new Map<string, { numero: number; nombre?: string }>()
    for (const m of mesas ?? []) {
      mesaMap.set(m.id, { numero: m.numero, nombre: m.nombre })
    }

    const habitacionMap = new Map<string, string>()
    for (const a of asignaciones ?? []) {
      const hab = a.habitaciones as unknown as { nombre: string } | { nombre: string }[] | null
      if (!hab) continue
      const nombre = Array.isArray(hab) ? hab[0]?.nombre : hab.nombre
      if (nombre) habitacionMap.set(a.persona_id, nombre)
    }

    const asistenciaMap = new Map<string, { llego: boolean; llegada_at: string | null }>()
    for (const a of asistencias ?? []) {
      asistenciaMap.set(a.caminante_id, { llego: a.llego, llegada_at: a.llegada_at })
    }

    const mesaResponsables: Record<string, { lider: string | null; colider: string | null }> = {}
    for (const s of servidores ?? []) {
      const mesaId = s.mesa_id as string | null
      if (!mesaId) continue

      if (!mesaResponsables[mesaId]) {
        mesaResponsables[mesaId] = { lider: null, colider: null }
      }

      if (s.tipo_servidor === "lider" && !mesaResponsables[mesaId].lider) {
        mesaResponsables[mesaId].lider = s.nombre_completo
      }

      if (s.tipo_servidor === "colider" && !mesaResponsables[mesaId].colider) {
        mesaResponsables[mesaId].colider = s.nombre_completo
      }
    }

    const result: CaminanteAsistenciaResumen[] = (caminantes ?? []).map((c: { id: string; nombre_completo: string; celular: string; imagen: string | null; mesa_id: string | null }) => {
      const mesa = c.mesa_id ? mesaMap.get(c.mesa_id) : null
      const asistencia = asistenciaMap.get(c.id)
      return {
        id: c.id,
        nombre_completo: c.nombre_completo,
        celular: c.celular,
        imagen: c.imagen ?? null,
        mesa_id: c.mesa_id ?? null,
        mesa_numero: mesa?.numero ?? null,
        habitacion_nombre: habitacionMap.get(c.id) ?? null,
        llego: asistencia?.llego ?? false,
        llegada_at: asistencia?.llegada_at ?? null,
      }
    })

    return NextResponse.json({
      caminantes: result,
      mesas: (mesas ?? []) as Mesa[],
      mesa_responsables: mesaResponsables,
    })
  } catch (error) {
    console.error("[asistencia] GET error:", error)
    return NextResponse.json({ message: "Error al obtener datos de asistencia" }, { status: 500 })
  }
}
