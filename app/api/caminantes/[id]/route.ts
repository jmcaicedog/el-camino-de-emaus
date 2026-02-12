import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification } from "@/lib/email/send-notification"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
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
        'monto_pagado',
        'fotos_recibidas',
      ]
      // If body contains keys outside allowedFields, deny
      const forbidden = Object.keys(body).some((k) => !allowedFields.includes(k))
      if (forbidden) return NextResponse.json({ message: 'No autorizado para modificar ese campo' }, { status: 403 })
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
