import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    const { data: servidor, error: servidorError } = await supabase
      .from("servidores")
      .select("id, auth_user_id, mesa_id, tipo_servidor, monto_pagado, monto_total")
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (servidorError) {
      return NextResponse.json({ message: servidorError.message }, { status: 400 })
    }

    if (!servidor) {
      return NextResponse.json(null, { status: 200 })
    }

    const service = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const [{ data: relaciones, error: relacionesError }, { data: asignacion, error: asignacionError }] = await Promise.all([
      supabase.from("servidor_equipo").select("equipos(nombre)").eq("servidor_id", servidor.id),
      service
        .from("asignaciones_alojamiento")
        .select("habitaciones(nombre, edificios(nombre))")
        .eq("persona_id", servidor.id)
        .eq("persona_tipo", "servidor")
        .maybeSingle(),
    ])

    if (relacionesError || asignacionError) {
      return NextResponse.json({ message: relacionesError?.message || asignacionError?.message || "No fue posible consultar el perfil" }, { status: 400 })
    }

    const habitacion = (Array.isArray(asignacion?.habitaciones) ? asignacion?.habitaciones[0] : asignacion?.habitaciones) as unknown as {
      nombre: string
      edificios: { nombre: string } | null
    } | null
    return NextResponse.json({
      ...servidor,
      equipos: (relaciones || []).map((relacion: any) => relacion.equipos?.nombre).filter(Boolean),
      alojamiento: habitacion?.edificios
        ? { edificio_nombre: habitacion.edificios.nombre, habitacion_nombre: habitacion.nombre }
        : null,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/servidores/me:", error)
    return NextResponse.json({ message: "No fue posible consultar el perfil" }, { status: 500 })
  }
}