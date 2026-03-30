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
      const allowedFields = [
        'medicamentos',
        'restricciones_alimenticias',
        'observaciones',
        'imagen',
        'cartas_recibidas',
        'fotos_recibidas',
        'caminantes_contactados',
        'familiares_contactados',
        'monto_pagado',
      ]
      // If body contains keys outside allowedFields, deny
      const forbidden = Object.keys(body).some((k) => !allowedFields.includes(k))
      if (forbidden) return NextResponse.json({ message: 'No autorizado para modificar ese campo' }, { status: 403 })

      // Check if user belongs to the "Cartas" equipo
      const { data: cartasEquipo } = await supabase
        .from("equipos")
        .select("id")
        .eq("nombre", "Cartas")
        .single()

      let isCartasTeam = false
      if (cartasEquipo) {
        const { data: servidorRecord } = await supabase
          .from("servidores")
          .select("id")
          .eq("auth_user_id", currentUser.id)
          .single()

        if (servidorRecord) {
          const { data: membership } = await supabase
            .from("servidor_equipo")
            .select("id")
            .eq("servidor_id", servidorRecord.id)
            .eq("equipo_id", cartasEquipo.id)
            .maybeSingle()
          isCartasTeam = !!membership
        }
      }

      // Cartas team can only edit cartas_recibidas, fotos_recibidas, and contact fields
      if (isCartasTeam) {
        const cartasAllowed = ['cartas_recibidas', 'fotos_recibidas', 'caminantes_contactados', 'familiares_contactados']
        const cartasForbidden = Object.keys(body).some((k) => !cartasAllowed.includes(k))
        if (cartasForbidden) {
          return NextResponse.json({ message: 'El equipo de Cartas solo puede modificar cartas, fotos y estado de contactos' }, { status: 403 })
        }
        // Cartas team is authorized for any caminante, skip mesa check
      } else {
        // Check that the user is líder/colíder of the caminante's mesa
        const { data: caminanteData } = await supabase.from("caminantes").select("mesa_id").eq("id", id).single()
        if (caminanteData?.mesa_id) {
          const { data: servidorData } = await supabase
            .from("servidores")
            .select("id")
            .eq("auth_user_id", currentUser.id)
            .eq("mesa_id", caminanteData.mesa_id)
            .in("tipo_servidor", ["lider", "colider"])
            .maybeSingle()
          if (!servidorData) {
            return NextResponse.json({ message: 'No autorizado para editar caminantes de otra mesa' }, { status: 403 })
          }
        }
      }
    }

    // Get the current caminante data before update
    const { data: currentCaminante } = await supabase.from("caminantes").select("*").eq("id", id).single()

    const { data, error } = await supabase.from("caminantes").update(body).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating caminante:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Check if mesa_id changed and send notification
    if ('mesa_id' in body && currentCaminante) {
      const oldMesaId = currentCaminante.mesa_id
      const newMesaId = body.mesa_id

      // Send notification when assigned to a new mesa
      if (newMesaId && newMesaId !== oldMesaId) {
        // Get mesa details and líder/colíder
        const { data: mesa } = await supabase.from("mesas").select("*").eq("id", newMesaId).single()
        
        if (mesa) {
          const { data: servidores } = await supabase
            .from("servidores")
            .select("correo, nombre_completo, tipo_servidor")
            .eq("mesa_id", newMesaId)
            .in("tipo_servidor", ["lider", "colider"])

          const emails = servidores?.map(s => s.correo).filter(Boolean) || []

          if (emails.length > 0) {
            const subject = `Nuevo caminante asignado a Mesa ${mesa.numero}`
            const text = `Se ha asignado un nuevo caminante a tu mesa.\n\nCaminante: ${data.nombre_completo}\nMesa: ${mesa.numero} - ${mesa.nombre}\n\nRevisa la plataforma para más detalles.`
            const html = `
              <h2>Nuevo caminante asignado</h2>
              <p>Se ha asignado un nuevo caminante a tu mesa:</p>
              <ul>
                <li><strong>Caminante:</strong> ${data.nombre_completo}</li>
                <li><strong>Mesa:</strong> ${mesa.numero} - ${mesa.nombre}</li>
              </ul>
              <p>Revisa la plataforma para más detalles.</p>
            `
            
            await sendEmailNotification({ to: emails, subject, text, html })
          }
        }
      }

      // Send notification when removed from a mesa
      if (oldMesaId && newMesaId === null) {
        const { data: mesa } = await supabase.from("mesas").select("*").eq("id", oldMesaId).single()
        
        if (mesa) {
          const { data: servidores } = await supabase
            .from("servidores")
            .select("correo, nombre_completo, tipo_servidor")
            .eq("mesa_id", oldMesaId)
            .in("tipo_servidor", ["lider", "colider"])

          const emails = servidores?.map(s => s.correo).filter(Boolean) || []

          if (emails.length > 0) {
            const subject = `Caminante removido de Mesa ${mesa.numero}`
            const text = `Se ha removido un caminante de tu mesa.\n\nCaminante: ${data.nombre_completo}\nMesa: ${mesa.numero} - ${mesa.nombre}\n\nRevisa la plataforma para más detalles.`
            const html = `
              <h2>Caminante removido</h2>
              <p>Se ha removido un caminante de tu mesa:</p>
              <ul>
                <li><strong>Caminante:</strong> ${data.nombre_completo}</li>
                <li><strong>Mesa:</strong> ${mesa.numero} - ${mesa.nombre}</li>
              </ul>
              <p>Revisa la plataforma para más detalles.</p>
            `
            
            await sendEmailNotification({ to: emails, subject, text, html })
          }
        }
      }
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/caminantes/[id]:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Only super admins can delete caminantes
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    if (!currentUser) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })

    const { data: adminRecord } = await supabase.from('admin_users').select('*').eq('id', currentUser.id).maybeSingle()
    const isSuper = !!adminRecord?.is_super
    if (!isSuper) return NextResponse.json({ message: 'No autorizado' }, { status: 403 })

    const { data, error } = await supabase.from('caminantes').delete().eq('id', id).select().single()

    if (error) {
      console.error('[v0] Error deleting caminante:', error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Caminante eliminado' }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in DELETE /api/caminantes/[id]:', error)
    return NextResponse.json({ message: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
