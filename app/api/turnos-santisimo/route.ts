import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getServidorAssignmentContext } from "@/lib/access-control"
import { getRetiroSettings } from "@/lib/retiro-settings"
import { isValidSantisimoSlot } from "@/lib/santisimo-turnos"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function getAuthorizedContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const context = await getServidorAssignmentContext(user.id)
  return context.canManageSantisimo ? context : null
}

export async function GET() {
  try {
    const context = await getAuthorizedContext()
    if (!context) return NextResponse.json({ message: "No autorizado" }, { status: 403 })

    const service = getServiceClient()
    const settings = await getRetiroSettings()
    const [{ data: turnos, error: turnosError }, { data: servidores, error: servidoresError }] = await Promise.all([
      service
        .from("turnos_santisimo")
        .select("id, servidor_id, turno_inicio, created_at, servidores(id, nombre_completo, imagen)")
        .order("turno_inicio", { ascending: true }),
      service
        .from("servidores")
        .select("id, nombre_completo, imagen")
        .order("nombre_completo", { ascending: true }),
    ])

    if (turnosError || servidoresError) {
      return NextResponse.json({ message: turnosError?.message || servidoresError?.message }, { status: 400 })
    }

    return NextResponse.json({
      retiro_datetime: settings.retiro_datetime,
      servidores: servidores || [],
      turnos: (turnos || []).map((turno: any) => ({
        id: turno.id,
        servidor_id: turno.servidor_id,
        turno_inicio: turno.turno_inicio,
        created_at: turno.created_at,
        servidor: Array.isArray(turno.servidores) ? turno.servidores[0] : turno.servidores,
      })),
    })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "No fue posible consultar los turnos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAuthorizedContext()
    if (!context) return NextResponse.json({ message: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const turnoInicio = typeof body.turno_inicio === "string" ? body.turno_inicio : ""
    const servidorIds = Array.isArray(body.servidor_ids)
      ? Array.from(new Set(body.servidor_ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)))
      : []
    const settings = await getRetiroSettings()

    if (!isValidSantisimoSlot(settings.retiro_datetime, turnoInicio)) {
      return NextResponse.json({ message: "La franja horaria no pertenece al horario del retiro" }, { status: 400 })
    }
    if (servidorIds.length === 0) {
      return NextResponse.json({ message: "Selecciona al menos un servidor" }, { status: 400 })
    }

    const service = getServiceClient()
    const { data: validServers, error: validServersError } = await service
      .from("servidores")
      .select("id")
      .in("id", servidorIds)

    if (validServersError) return NextResponse.json({ message: validServersError.message }, { status: 400 })
    if ((validServers || []).length !== servidorIds.length) {
      return NextResponse.json({ message: "Uno o más servidores no existen" }, { status: 400 })
    }

    const rows = servidorIds.map((servidorId) => ({ servidor_id: servidorId, turno_inicio: turnoInicio }))
    const { error } = await service
      .from("turnos_santisimo")
      .upsert(rows, { onConflict: "servidor_id,turno_inicio", ignoreDuplicates: true })

    if (error) return NextResponse.json({ message: error.message }, { status: 400 })
    return NextResponse.json({ message: "Turno asignado" }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "No fue posible asignar el turno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getAuthorizedContext()
    if (!context) return NextResponse.json({ message: "No autorizado" }, { status: 403 })

    const turnoId = new URL(request.url).searchParams.get("id")
    if (!turnoId) return NextResponse.json({ message: "El turno es obligatorio" }, { status: 400 })

    const { error } = await getServiceClient().from("turnos_santisimo").delete().eq("id", turnoId)
    if (error) return NextResponse.json({ message: error.message }, { status: 400 })
    return NextResponse.json({ message: "Servidor removido del turno" })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "No fue posible remover el turno" }, { status: 500 })
  }
}
