import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getServidorAssignmentContext } from "@/lib/access-control"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    const context = await getServidorAssignmentContext(user.id)
    const service = getServiceClient()

    let eventosQuery = service
      .from("minuto_eventos")
      .select("id, titulo, descripcion, ubicacion, fecha_inicio, fecha_fin, color, created_at, updated_at")
      .order("fecha_inicio", { ascending: true })

    if (!context.isFullViewer) {
      // Filtrar sólo eventos asignados al servidor o a sus equipos
      const orConditions: string[] = []
      if (context.servidorId) {
        orConditions.push(`and(tipo_responsable.eq.servidor,servidor_id.eq.${context.servidorId})`)
      }
      if (context.equipoIds.length > 0) {
        const equipoList = `(${context.equipoIds.join(",")})`
        orConditions.push(`and(tipo_responsable.eq.equipo,equipo_id.in.${equipoList})`)
      }

      if (orConditions.length === 0) {
        return NextResponse.json({
          eventos: [],
          canManage: false,
          isFullViewer: false,
          servidorNombre: context.servidorNombre,
        })
      }

      const { data: asignaciones, error: asigError } = await service
        .from("minuto_evento_responsables")
        .select("evento_id")
        .or(orConditions.join(","))

      if (asigError) {
        return NextResponse.json({ message: asigError.message }, { status: 400 })
      }

      const eventoIds = Array.from(new Set((asignaciones || []).map((a: any) => a.evento_id)))

      if (eventoIds.length === 0) {
        return NextResponse.json({
          eventos: [],
          canManage: false,
          isFullViewer: false,
          servidorNombre: context.servidorNombre,
        })
      }

      eventosQuery = eventosQuery.in("id", eventoIds)
    }

    const { data: eventos, error: eventosError } = await eventosQuery

    if (eventosError) {
      return NextResponse.json({ message: eventosError.message }, { status: 400 })
    }

    if (!eventos || eventos.length === 0) {
      return NextResponse.json({
        eventos: [],
        canManage: context.isSuper,
        isFullViewer: context.isFullViewer,
        servidorNombre: context.servidorNombre,
      })
    }

    const eventoIds = eventos.map((e) => e.id)
    const { data: responsables, error: respError } = await service
      .from("minuto_evento_responsables")
      .select(`
        id,
        evento_id,
        tipo_responsable,
        servidor_id,
        equipo_id,
        servidores (id, nombre_completo, imagen, celular),
        equipos (id, nombre)
      `)
      .in("evento_id", eventoIds)

    if (respError) {
      return NextResponse.json({ message: respError.message }, { status: 400 })
    }

    const respMap = new Map<string, any[]>()
    for (const r of responsables || []) {
      const list = respMap.get(r.evento_id) || []
      list.push({
        id: r.id,
        evento_id: r.evento_id,
        tipo_responsable: r.tipo_responsable,
        servidor_id: r.servidor_id,
        equipo_id: r.equipo_id,
        servidor: r.servidores,
        equipo: r.equipos,
      })
      respMap.set(r.evento_id, list)
    }

    const enrichedEventos = eventos.map((e) => ({
      ...e,
      responsables: respMap.get(e.id) || [],
    }))

    return NextResponse.json({
      eventos: enrichedEventos,
      canManage: context.isSuper,
      isFullViewer: context.isFullViewer,
      servidorNombre: context.servidorNombre,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Error al obtener eventos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("is_super")
      .eq("id", user.id)
      .maybeSingle()

    if (!adminRecord?.is_super) {
      return NextResponse.json({ message: "Solo los superadministradores pueden crear eventos" }, { status: 403 })
    }

    const body = await request.json()
    const titulo = typeof body.titulo === "string" ? body.titulo.trim() : ""
    const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim() : null
    const ubicacion = typeof body.ubicacion === "string" ? body.ubicacion.trim() : null
    const fechaInicio = typeof body.fecha_inicio === "string" ? body.fecha_inicio : ""
    const fechaFin = typeof body.fecha_fin === "string" ? body.fecha_fin : ""
    const color = typeof body.color === "string" && body.color ? body.color : "sky"
    const responsables = Array.isArray(body.responsables) ? body.responsables : []

    if (!titulo) {
      return NextResponse.json({ message: "El título del evento es obligatorio" }, { status: 400 })
    }

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ message: "Las fechas de inicio y fin son obligatorias" }, { status: 400 })
    }

    const startDate = new Date(fechaInicio)
    const endDate = new Date(fechaFin)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ message: "Formato de fecha inválido" }, { status: 400 })
    }

    if (endDate < startDate) {
      return NextResponse.json({ message: "La fecha/hora de fin no puede ser anterior a la de inicio" }, { status: 400 })
    }

    const service = getServiceClient()

    const { data: nuevoEvento, error: insertError } = await service
      .from("minuto_eventos")
      .insert({
        titulo,
        descripcion,
        ubicacion,
        fecha_inicio: startDate.toISOString(),
        fecha_fin: endDate.toISOString(),
        color,
      })
      .select()
      .single()

    if (insertError || !nuevoEvento) {
      return NextResponse.json({ message: insertError?.message || "Error al crear evento" }, { status: 400 })
    }

    if (responsables.length > 0) {
      const respRows = responsables
        .map((r: any) => {
          if (r.tipo_responsable === "servidor" && r.servidor_id) {
            return {
              evento_id: nuevoEvento.id,
              tipo_responsable: "servidor",
              servidor_id: r.servidor_id,
              equipo_id: null,
            }
          }
          if (r.tipo_responsable === "equipo" && r.equipo_id) {
            return {
              evento_id: nuevoEvento.id,
              tipo_responsable: "equipo",
              equipo_id: r.equipo_id,
              servidor_id: null,
            }
          }
          return null
        })
        .filter(Boolean)

      if (respRows.length > 0) {
        const { error: respInsertError } = await service
          .from("minuto_evento_responsables")
          .insert(respRows)

        if (respInsertError) {
          console.error("Error al insertar responsables:", respInsertError)
        }
      }
    }

    // Obtener evento completo con relaciones
    const { data: responsablesCompletos } = await service
      .from("minuto_evento_responsables")
      .select(`
        id,
        evento_id,
        tipo_responsable,
        servidor_id,
        equipo_id,
        servidores (id, nombre_completo, imagen, celular),
        equipos (id, nombre)
      `)
      .eq("evento_id", nuevoEvento.id)

    const fullEvento = {
      ...nuevoEvento,
      responsables: (responsablesCompletos || []).map((r: any) => ({
        id: r.id,
        evento_id: r.evento_id,
        tipo_responsable: r.tipo_responsable,
        servidor_id: r.servidor_id,
        equipo_id: r.equipo_id,
        servidor: r.servidores,
        equipo: r.equipos,
      })),
    }

    return NextResponse.json(fullEvento, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Error al procesar solicitud" }, { status: 500 })
  }
}
