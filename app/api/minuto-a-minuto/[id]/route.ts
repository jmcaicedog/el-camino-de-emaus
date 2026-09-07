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
    if (typeof body.fecha_inicio === "string") updateData.fecha_inicio = new Date(body.fecha_inicio).toISOString()
    if (typeof body.fecha_fin === "string") updateData.fecha_fin = new Date(body.fecha_fin).toISOString()

    if (updateData.fecha_inicio && updateData.fecha_fin) {
      if (new Date(updateData.fecha_fin) < new Date(updateData.fecha_inicio)) {
        return NextResponse.json({ message: "La fecha/hora de fin no puede ser anterior a la de inicio" }, { status: 400 })
      }
    }

    const service = getServiceClient()

    const { data: updatedEvento, error: updateError } = await service
      .from("minuto_eventos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

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
