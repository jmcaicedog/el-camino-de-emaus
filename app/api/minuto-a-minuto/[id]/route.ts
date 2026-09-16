import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

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

interface RouteParams {
  params: Promise<{ id: string }>
}

function getBogotaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
      return NextResponse.json({ message: "Solo los superadministradores pueden editar eventos" }, { status: 403 })
    }

    const body = await request.json()
    const updateData: Record<string, any> = {}

    if (typeof body.titulo === "string") updateData.titulo = body.titulo.trim()
    if (typeof body.descripcion !== "undefined") updateData.descripcion = body.descripcion ? body.descripcion.trim() : null
    if (typeof body.ubicacion !== "undefined") updateData.ubicacion = body.ubicacion ? body.ubicacion.trim() : null
    if (typeof body.requerimientos !== "undefined") updateData.requerimientos = body.requerimientos ? body.requerimientos.trim() : null
    if (typeof body.color === "string") updateData.color = body.color
    const requestedStart = typeof body.fecha_inicio === "string" ? new Date(body.fecha_inicio) : null
    const requestedEnd = typeof body.fecha_fin === "string" ? new Date(body.fecha_fin) : null

    if (requestedStart && Number.isNaN(requestedStart.getTime())) {
      return NextResponse.json({ message: "Formato de fecha de inicio inválido" }, { status: 400 })
    }
    if (requestedEnd && Number.isNaN(requestedEnd.getTime())) {
      return NextResponse.json({ message: "Formato de fecha de fin inválido" }, { status: 400 })
    }

    if (requestedStart) updateData.fecha_inicio = requestedStart.toISOString()
    if (requestedEnd) updateData.fecha_fin = requestedEnd.toISOString()

    if (updateData.fecha_inicio && updateData.fecha_fin) {
      if (new Date(updateData.fecha_fin) < new Date(updateData.fecha_inicio)) {
        return NextResponse.json({ message: "La fecha/hora de fin no puede ser anterior a la de inicio" }, { status: 400 })
      }
    }

    const service = getServiceClient()

    const { data: currentEvento, error: currentError } = await service
      .from("minuto_eventos")
      .select("*")
      .eq("id", id)
      .single()

    if (currentError || !currentEvento) {
      return NextResponse.json({ message: currentError?.message || "Evento no encontrado" }, { status: 404 })
    }

    const currentStart = new Date(currentEvento.fecha_inicio)
    const currentEnd = new Date(currentEvento.fecha_fin)
    const startDeltaMs = requestedStart ? requestedStart.getTime() - currentStart.getTime() : 0
    const endDeltaMs = requestedEnd ? requestedEnd.getTime() - currentEnd.getTime() : 0
    const deltaMs = endDeltaMs !== 0 ? endDeltaMs : startDeltaMs
    const shouldMoveFollowing = body.mover_siguientes === true && deltaMs !== 0
    let followingEventos: Record<string, any>[] = []

    if (shouldMoveFollowing) {
      if (requestedStart && getBogotaDateKey(requestedStart) !== getBogotaDateKey(currentStart)) {
        return NextResponse.json({ message: "Solo se pueden mover actividades posteriores dentro del mismo día" }, { status: 400 })
      }

      const dayStart = new Date(`${getBogotaDateKey(currentStart)}T00:00:00-05:00`)
      const nextDayStart = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const { data, error } = await service
        .from("minuto_eventos")
        .select("*")
        .gt("fecha_inicio", currentEvento.fecha_inicio)
        .lt("fecha_inicio", nextDayStart.toISOString())
        .order("fecha_inicio", { ascending: true })

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 })
      }
      followingEventos = data || []
    }

    const scheduleRows = [
      { ...currentEvento, ...updateData },
      ...followingEventos.map((evento) => ({
        ...evento,
        fecha_inicio: new Date(new Date(evento.fecha_inicio).getTime() + deltaMs).toISOString(),
        fecha_fin: new Date(new Date(evento.fecha_fin).getTime() + deltaMs).toISOString(),
      })),
    ]
    const { data: updatedSchedule, error: updateError } = await service
      .from("minuto_eventos")
      .upsert(scheduleRows, { onConflict: "id" })
      .select()

    const updatedEvento = updatedSchedule?.find((evento) => evento.id === id)

    if (updateError || !updatedEvento) {
      return NextResponse.json({ message: updateError?.message || "Error al actualizar evento" }, { status: 400 })
    }

    if (Array.isArray(body.responsables)) {
      // Reemplazar responsables
      await service.from("minuto_evento_responsables").delete().eq("evento_id", id)

      const respRows = body.responsables
        .map((r: any) => {
          if (r.tipo_responsable === "todos") {
            return {
              evento_id: id,
              tipo_responsable: "todos",
              servidor_id: null,
              equipo_id: null,
            }
          }
          if (r.tipo_responsable === "servidor" && r.servidor_id) {
            return {
              evento_id: id,
              tipo_responsable: "servidor",
              servidor_id: r.servidor_id,
              equipo_id: null,
            }
          }
          if (r.tipo_responsable === "equipo" && r.equipo_id) {
            return {
              evento_id: id,
              tipo_responsable: "equipo",
              equipo_id: r.equipo_id,
              servidor_id: null,
            }
          }
          return null
        })
        .filter(Boolean)

      if (respRows.length > 0) {
        await service.from("minuto_evento_responsables").insert(respRows)
      }
    }

    const { data: responsablesCompletos } = await service
      .from("minuto_evento_responsables")
      .select(`
        id,
        evento_id,
        tipo_responsable,
        servidor_id,
        equipo_id,
        servidores (id, nombre_completo, imagen, celular),
        equipos (id, nombre, tipo)
      `)
      .eq("evento_id", id)

    const fullEvento = {
      ...updatedEvento,
      actividades_movidas: followingEventos.length,
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

    return NextResponse.json(fullEvento)
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Error al actualizar evento" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
      return NextResponse.json({ message: "Solo los superadministradores pueden eliminar eventos" }, { status: 403 })
    }

    const service = getServiceClient()
    const { error: deleteError } = await service.from("minuto_eventos").delete().eq("id", id)

    if (deleteError) {
      return NextResponse.json({ message: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Error al eliminar evento" }, { status: 500 })
  }
}
