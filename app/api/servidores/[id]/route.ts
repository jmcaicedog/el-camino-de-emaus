import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
        'imagen',
        'monto_pagado',
        'retiros_anteriores',
        'experiencia_servicio',
      ]
      const forbidden = Object.keys(body).some((k) => !allowedFields.includes(k))
      if (forbidden) return NextResponse.json({ message: 'No autorizado para modificar ese campo' }, { status: 403 })
    }

    const { data, error } = await supabase.from("servidores").update(body).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating servidor:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Si se actualiza tipo_servidor a líder o colíder, agregar al equipo de líderes
    if (body.tipo_servidor && (body.tipo_servidor === "lider" || body.tipo_servidor === "colider")) {
      const { data: equipoLideres } = await supabase
        .from("equipos")
        .select("id")
        .eq("nombre", "Líderes y colíderes")
        .single()

      if (equipoLideres) {
        // Verificar si ya está en el equipo
        const { data: existing } = await supabase
          .from("servidor_equipo")
          .select("id")
          .eq("servidor_id", id)
          .eq("equipo_id", equipoLideres.id)
          .maybeSingle()

        if (!existing) {
          await supabase
            .from("servidor_equipo")
            .insert({ servidor_id: id, equipo_id: equipoLideres.id })
        }
      }
    }

    // Si se actualiza mesa_id y el servidor tiene tipo_servidor, también agregarlo al equipo
    if (body.mesa_id && data.tipo_servidor && (data.tipo_servidor === "lider" || data.tipo_servidor === "colider")) {
      const { data: equipoLideres } = await supabase
        .from("equipos")
        .select("id")
        .eq("nombre", "Líderes y colíderes")
        .single()

      if (equipoLideres) {
        const { data: existing } = await supabase
          .from("servidor_equipo")
          .select("id")
          .eq("servidor_id", id)
          .eq("equipo_id", equipoLideres.id)
          .maybeSingle()

        if (!existing) {
          await supabase
            .from("servidor_equipo")
            .insert({ servidor_id: id, equipo_id: equipoLideres.id })
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
