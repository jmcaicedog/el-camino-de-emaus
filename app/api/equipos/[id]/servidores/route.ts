import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { formatPersonName } from "@/lib/utils"

const RETREAT_COORDINATOR_TEAM_NAME = "Coordinador del retiro"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: servidores, error } = await supabase
      .from("servidor_equipo")
      .select(`
        servidor_id,
        es_lider,
        servidores (
          id,
          nombre_completo,
          celular,
          tipo_servidor,
          imagen
        )
      `)
      .eq("equipo_id", id)

    if (error) throw error

    const servidoresList =
      servidores
        ?.map((r: any) => r.servidores ? ({ ...r.servidores, es_lider_equipo: r.es_lider }) : null)
        .filter(Boolean)
        .map((s: any) => ({
          ...s,
          nombre_completo: formatPersonName(s.nombre_completo),
        })) || []

    return NextResponse.json(servidoresList)
  } catch (error) {
    console.error("Error fetching servidores for equipo:", error)
    return NextResponse.json({ message: "Error al obtener servidores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { servidor_id } = body

    const supabase = await createClient()

    // Verificar que el usuario es superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("is_super")
      .eq("id", user.id)
      .single()

    if (!adminUser?.is_super) {
      return NextResponse.json({ message: "No autorizado. Solo superadmin puede gestionar equipos" }, { status: 403 })
    }

    // Verificar si la relación ya existe
    const { data: existing } = await supabase
      .from("servidor_equipo")
      .select("id")
      .eq("equipo_id", id)
      .eq("servidor_id", servidor_id)
      .single()

    if (existing) {
      return NextResponse.json({ message: "El servidor ya está en este equipo" }, { status: 400 })
    }

    // Obtener información del equipo y servidor
    const { data: equipo } = await supabase
      .from("equipos")
      .select("nombre")
      .eq("id", id)
      .single()

    const { data: servidor } = await supabase
      .from("servidores")
      .select("id, nombre_completo, correo, auth_user_id")
      .eq("id", servidor_id)
      .single()

    // Crear la relación
    const { error } = await supabase
      .from("servidor_equipo")
      .insert({ equipo_id: id, servidor_id })

    if (error) throw error

    // Si el equipo es Coordinador del retiro y el servidor ya es admin, elevar a superadmin.
    if (equipo?.nombre === RETREAT_COORDINATOR_TEAM_NAME && servidor?.auth_user_id) {
      const { error: promoteError } = await supabase
        .from("admin_users")
        .update({ is_super: true })
        .eq("id", servidor.auth_user_id)

      if (promoteError) {
        console.error("Error promoting coordinator to superadmin:", promoteError)
      }
    }

    // Enviar notificación al servidor
    if (servidor?.correo && equipo?.nombre) {
      const subject = `Asignación a Equipo - El Camino de Emaús`
      const nombreServidor = formatPersonName(servidor.nombre_completo)
      const text = `Hola ${nombreServidor},\n\nHas sido asignado(a) al equipo "${equipo.nombre}".\n\n¡Que Dios te bendiga en este servicio!\n\nEquipo El Camino de Emaús`
      const html = `
        <h2>Asignación a Equipo</h2>
        <p>Hola <strong>${nombreServidor}</strong>,</p>
        <p>Has sido asignado(a) al equipo <strong>"${equipo.nombre}"</strong>.</p>
        <p>¡Que Dios te bendiga en este servicio!</p>
        <br>
        <p>Equipo El Camino de Emaús</p>
      `
      await sendEmailNotification({ to: [servidor.correo], subject, text, html })
    }

    return NextResponse.json({ message: "Servidor agregado al equipo exitosamente" })
  } catch (error) {
    console.error("Error adding servidor to equipo:", error)
    return NextResponse.json({ message: "Error al agregar servidor al equipo" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { servidor_id } = body

    if (!servidor_id) {
      return NextResponse.json({ message: "servidor_id es requerido" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("is_super")
      .eq("id", user.id)
      .single()

    if (!adminUser?.is_super) {
      return NextResponse.json({ message: "No autorizado. Solo superadmin puede gestionar equipos" }, { status: 403 })
    }

    const { data: relaciones, error: relacionesError } = await supabase
      .from("servidor_equipo")
      .select("id, servidor_id")
      .eq("equipo_id", id)

    if (relacionesError) throw relacionesError

    if (!relaciones || relaciones.length < 2) {
      return NextResponse.json({ message: "Solo se puede designar líder en equipos con más de un miembro" }, { status: 400 })
    }

    if (!relaciones.some((relacion) => relacion.servidor_id === servidor_id)) {
      return NextResponse.json({ message: "El servidor no pertenece a este equipo" }, { status: 400 })
    }

    const { error: clearError } = await supabase
      .from("servidor_equipo")
      .update({ es_lider: false })
      .eq("equipo_id", id)

    if (clearError) throw clearError

    const { error: setError } = await supabase
      .from("servidor_equipo")
      .update({ es_lider: true })
      .eq("equipo_id", id)
      .eq("servidor_id", servidor_id)

    if (setError) throw setError

    return NextResponse.json({ message: "Líder de equipo actualizado exitosamente" })
  } catch (error) {
    console.error("Error updating equipo leader:", error)
    return NextResponse.json({ message: "Error al actualizar líder de equipo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const servidor_id = searchParams.get("servidor_id")

    if (!servidor_id) {
      return NextResponse.json({ message: "servidor_id es requerido" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el usuario es superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("is_super")
      .eq("id", user.id)
      .single()

    if (!adminUser?.is_super) {
      return NextResponse.json({ message: "No autorizado. Solo superadmin puede gestionar equipos" }, { status: 403 })
    }

    // Obtener información del equipo y servidor antes de eliminar
    const { data: equipo } = await supabase
      .from("equipos")
      .select("nombre")
      .eq("id", id)
      .single()

    const { data: servidor } = await supabase
      .from("servidores")
      .select("id, nombre_completo, correo, auth_user_id")
      .eq("id", servidor_id)
      .single()

    const { error } = await supabase
      .from("servidor_equipo")
      .delete()
      .eq("equipo_id", id)
      .eq("servidor_id", servidor_id)

    if (error) throw error

    // Si se remueve del equipo Coordinador del retiro y es admin, retirar privilegio superadmin.
    if (equipo?.nombre === RETREAT_COORDINATOR_TEAM_NAME && servidor?.auth_user_id) {
      const { error: demoteError } = await supabase
        .from("admin_users")
        .update({ is_super: false })
        .eq("id", servidor.auth_user_id)

      if (demoteError) {
        console.error("Error demoting coordinator from superadmin:", demoteError)
      }
    }

    // Enviar notificación al servidor
    if (servidor?.correo && equipo?.nombre) {
      const subject = `Desasignación de Equipo - El Camino de Emaús`
      const nombreServidor = formatPersonName(servidor.nombre_completo)
      const text = `Hola ${nombreServidor},\n\nHas sido removido(a) del equipo "${equipo.nombre}".\n\nSi tienes alguna pregunta, por favor contacta a los administradores.\n\nEquipo El Camino de Emaús`
      const html = `
        <h2>Desasignación de Equipo</h2>
        <p>Hola <strong>${nombreServidor}</strong>,</p>
        <p>Has sido removido(a) del equipo <strong>"${equipo.nombre}"</strong>.</p>
        <p>Si tienes alguna pregunta, por favor contacta a los administradores.</p>
        <br>
        <p>Equipo El Camino de Emaús</p>
      `
      await sendEmailNotification({ to: [servidor.correo], subject, text, html })
    }

    return NextResponse.json({ message: "Servidor removido del equipo exitosamente" })
  } catch (error) {
    console.error("Error removing servidor from equipo:", error)
    return NextResponse.json({ message: "Error al remover servidor del equipo" }, { status: 500 })
  }
}
