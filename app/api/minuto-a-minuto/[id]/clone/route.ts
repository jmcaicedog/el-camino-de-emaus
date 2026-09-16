import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface RouteParams {
  params: Promise<{ id: string }>
}

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

function getBogotaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export async function POST(_request: Request, { params }: RouteParams) {
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
      return NextResponse.json({ message: "Solo los superadministradores pueden clonar eventos" }, { status: 403 })
    }

    const service = getServiceClient()
    const { data: eventoOriginal, error: eventoError } = await service
      .from("minuto_eventos")
      .select("*")
      .eq("id", id)
      .single()

    if (eventoError || !eventoOriginal) {
      return NextResponse.json({ message: eventoError?.message || "Evento no encontrado" }, { status: 404 })
    }

    const inicioOriginal = new Date(eventoOriginal.fecha_inicio)
    const finOriginal = new Date(eventoOriginal.fecha_fin)
    const duracionMs = finOriginal.getTime() - inicioOriginal.getTime()

    if (duracionMs < 0) {
      return NextResponse.json({ message: "La actividad original tiene un horario inválido" }, { status: 400 })
    }

    const inicioCopia = finOriginal
    const finCopia = new Date(inicioCopia.getTime() + duracionMs)
    const inicioDia = new Date(`${getBogotaDateKey(inicioOriginal)}T00:00:00-05:00`)
    const inicioDiaSiguiente = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000)

    const [{ data: responsables, error: responsablesError }, { data: eventosPosteriores, error: posterioresError }] = await Promise.all([
      service
        .from("minuto_evento_responsables")
        .select("tipo_responsable, servidor_id, equipo_id")
        .eq("evento_id", id),
      service
        .from("minuto_eventos")
        .select("*")
        .gte("fecha_inicio", finOriginal.toISOString())
        .lt("fecha_inicio", inicioDiaSiguiente.toISOString())
        .order("fecha_inicio", { ascending: true }),
    ])

    if (responsablesError || posterioresError) {
      return NextResponse.json(
        { message: responsablesError?.message || posterioresError?.message || "No se pudo preparar la copia" },
        { status: 400 },
      )
    }

    const { id: _eventoId, created_at: _createdAt, updated_at: _updatedAt, ...datosOriginales } = eventoOriginal
    const { data: eventoClonado, error: cloneError } = await service
      .from("minuto_eventos")
      .insert({
        ...datosOriginales,
        fecha_inicio: inicioCopia.toISOString(),
        fecha_fin: finCopia.toISOString(),
      })
      .select()
      .single()

    if (cloneError || !eventoClonado) {
      return NextResponse.json({ message: cloneError?.message || "No se pudo clonar la actividad" }, { status: 400 })
    }

    const filasMovidas = (eventosPosteriores || []).map((evento) => ({
      ...evento,
      fecha_inicio: new Date(new Date(evento.fecha_inicio).getTime() + duracionMs).toISOString(),
      fecha_fin: new Date(new Date(evento.fecha_fin).getTime() + duracionMs).toISOString(),
    }))

    if (filasMovidas.length > 0) {
      const { error: moveError } = await service
        .from("minuto_eventos")
        .upsert(filasMovidas, { onConflict: "id" })

      if (moveError) {
        await service.from("minuto_eventos").delete().eq("id", eventoClonado.id)
        return NextResponse.json({ message: moveError.message }, { status: 400 })
      }
    }

    const responsablesClonados = (responsables || []).map((responsable) => ({
      evento_id: eventoClonado.id,
      tipo_responsable: responsable.tipo_responsable,
      servidor_id: responsable.servidor_id,
      equipo_id: responsable.equipo_id,
    }))

    if (responsablesClonados.length > 0) {
      const { error: insertResponsablesError } = await service
        .from("minuto_evento_responsables")
        .insert(responsablesClonados)

      if (insertResponsablesError) {
        if ((eventosPosteriores || []).length > 0) {
          await service.from("minuto_eventos").upsert(eventosPosteriores!, { onConflict: "id" })
        }
        await service.from("minuto_eventos").delete().eq("id", eventoClonado.id)
        return NextResponse.json({ message: insertResponsablesError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      evento: eventoClonado,
      actividades_movidas: filasMovidas.length,
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Error al clonar la actividad" }, { status: 500 })
  }
}