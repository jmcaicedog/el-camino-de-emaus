import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { formatPersonName } from "@/lib/utils"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    if (typeof body.nombre_completo === "string") {
      body.nombre_completo = formatPersonName(body.nombre_completo)
    }
    const supabase = await createClient()

    // Get current user and admin record to check permissions
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    if (!currentUser) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })

    const { data: adminRecord } = await supabase.from('admin_users').select('*').eq('id', currentUser.id).maybeSingle()
    const isSuper = !!adminRecord?.is_super

    // If not super admin, restrict which fields can be modified
    if (!isSuper) {
      const bodyKeys = Object.keys(body)
      const isPaymentOnlyUpdate = bodyKeys.length === 1 && bodyKeys[0] === 'monto_pagado'

      const allowedFields = [
        'medicamentos',
        'restricciones_alimenticias',
        'imagen',
        'monto_pagado',
        'retiros_anteriores',
        'experiencia_servicio',
      ]
      const forbidden = Object.keys(body).some((k) => !allowedFields.includes(k))
      if (forbidden) return NextResponse.json({ message: 'No autorizado para modificar ese campo' }, { status: 403 })

      // Miembros de contabilidad pueden actualizar monto_pagado de cualquier servidor.
      if (isPaymentOnlyUpdate) {
        const { data: servidorRecord } = await supabase
          .from("servidores")
          .select("id")
          .eq("auth_user_id", currentUser.id)
          .maybeSingle()

        if (servidorRecord?.id) {
          const { data: memberships } = await supabase
            .from("servidor_equipo")
            .select("equipos(nombre)")
            .eq("servidor_id", servidorRecord.id)

          const isContabilidadTeam = (memberships || []).some((membership: any) => {
            const nombre = String(membership?.equipos?.nombre || "")
            const normalized = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
            return normalized.includes("contabilidad")
          })

          if (!isContabilidadTeam) {
            return NextResponse.json({ message: 'No autorizado para modificar pagos' }, { status: 403 })
          }
        } else {
          return NextResponse.json({ message: 'No autorizado para modificar pagos' }, { status: 403 })
        }
      }
    }

    // Obtener datos anteriores para comparar cambios
    const { data: oldData } = await supabase
      .from("servidores")
      .select("mesa_id, tipo_servidor, nombre_completo, correo")
      .eq("id", id)
      .single()

    // Si se está desasignando de una mesa (mesa_id = null), limpiar también tipo_servidor
    if ('mesa_id' in body && body.mesa_id === null) {
      body.tipo_servidor = null
    }

    const { data, error } = await supabase.from("servidores").update(body).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating servidor:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Sincronizar membresía del equipo de líderes/colíderes y notificar cambios
    const oldIsLiderConMesa = !!oldData?.mesa_id && (oldData.tipo_servidor === "lider" || oldData.tipo_servidor === "colider")
    const newIsLiderConMesa = !!data?.mesa_id && (data.tipo_servidor === "lider" || data.tipo_servidor === "colider")

    if (oldIsLiderConMesa !== newIsLiderConMesa) {
      const { data: equipoLideres } = await supabase
        .from("equipos")
        .select("id, nombre")
        .eq("nombre", "Líderes y colíderes")
        .single()

      if (equipoLideres) {
        const { data: existing } = await supabase
          .from("servidor_equipo")
          .select("id")
          .eq("servidor_id", id)
          .eq("equipo_id", equipoLideres.id)
          .maybeSingle()

        if (newIsLiderConMesa && !existing) {
          await supabase
            .from("servidor_equipo")
            .insert({ servidor_id: id, equipo_id: equipoLideres.id })

          if (data.correo) {
            const nombreServidor = formatPersonName(data.nombre_completo)
            const subject = `Asignación a Equipo - El Camino de Emaús`
            const text = `Hola ${nombreServidor},\n\nHas sido asignado(a) al equipo "${equipoLideres.nombre}".\n\n¡Que Dios te bendiga en este servicio!\n\nEquipo El Camino de Emaús`
            const html = `
              <h2>Asignación a Equipo</h2>
              <p>Hola <strong>${nombreServidor}</strong>,</p>
              <p>Has sido asignado(a) al equipo <strong>"${equipoLideres.nombre}"</strong>.</p>
              <p>¡Que Dios te bendiga en este servicio!</p>
              <br>
              <p>Equipo El Camino de Emaús</p>
            `
            await sendEmailNotification({ to: [data.correo], subject, text, html, includeSuperAdmins: true })
          }
        }

        if (!newIsLiderConMesa && existing) {
          await supabase
            .from("servidor_equipo")
            .delete()
            .eq("servidor_id", id)
            .eq("equipo_id", equipoLideres.id)

          if (data.correo) {
            const nombreServidor = formatPersonName(data.nombre_completo)
            const subject = `Desasignación de Equipo - El Camino de Emaús`
            const text = `Hola ${nombreServidor},\n\nHas sido removido(a) del equipo "${equipoLideres.nombre}".\n\nSi tienes alguna pregunta, por favor contacta a los administradores.\n\nEquipo El Camino de Emaús`
            const html = `
              <h2>Desasignación de Equipo</h2>
              <p>Hola <strong>${nombreServidor}</strong>,</p>
              <p>Has sido removido(a) del equipo <strong>"${equipoLideres.nombre}"</strong>.</p>
              <p>Si tienes alguna pregunta, por favor contacta a los administradores.</p>
              <br>
              <p>Equipo El Camino de Emaús</p>
            `
            await sendEmailNotification({ to: [data.correo], subject, text, html, includeSuperAdmins: true })
          }
        }
      }
    }

    // Enviar notificación si se asignó a una mesa con un rol
    if (body.mesa_id && oldData && body.mesa_id !== oldData.mesa_id) {
      const tipoServidor = body.tipo_servidor || data.tipo_servidor
      
      if (tipoServidor && data.correo) {
        // Obtener información de la mesa
        const { data: mesa } = await supabase
          .from("mesas")
          .select("numero")
          .eq("id", body.mesa_id)
          .single()

        if (mesa) {
          const rolTexto = tipoServidor === "lider" ? "Líder" : tipoServidor === "colider" ? "Colíder" : "Servidor"
          const subject = `Asignación como ${rolTexto} - El Camino de Emaús`
          const text = `Hola ${data.nombre_completo},\n\nHas sido asignado(a) como ${rolTexto} de la Mesa ${mesa.numero}.\n\n¡Que Dios te bendiga en este servicio!\n\nEquipo El Camino de Emaús`
          const html = `
            <h2>Asignación de Rol y Mesa</h2>
            <p>Hola <strong>${data.nombre_completo}</strong>,</p>
            <p>Has sido asignado(a) como <strong>${rolTexto}</strong> de la <strong>Mesa ${mesa.numero}</strong>.</p>
            <p>¡Que Dios te bendiga en este servicio!</p>
            <br>
            <p>Equipo El Camino de Emaús</p>
          `
          await sendEmailNotification({ to: [data.correo], subject, text, html, includeSuperAdmins: true })
        }
      }
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/servidores/[id]:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Only super admins can delete servidores
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    if (!currentUser) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })

    const { data: adminRecord } = await supabase.from('admin_users').select('*').eq('id', currentUser.id).maybeSingle()
    const isSuper = !!adminRecord?.is_super
    if (!isSuper) return NextResponse.json({ message: 'No autorizado' }, { status: 403 })

    const { data, error } = await supabase.from('servidores').delete().eq('id', id).select().single()

    if (error) {
      console.error('[v0] Error deleting servidor:', error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Servidor eliminado' }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in DELETE /api/servidores/[id]:', error)
    return NextResponse.json({ message: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
