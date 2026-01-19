import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Obtener todos los equipos
    const { data: equipos, error: equiposError } = await supabase
      .from("equipos")
      .select("*")
      .order("nombre")

    if (equiposError) throw equiposError

    // Para cada equipo, obtener los servidores asignados
    const equiposConServidores = await Promise.all(
      (equipos || []).map(async (equipo) => {
        const { data: relaciones } = await supabase
          .from("servidor_equipo")
          .select("servidor_id")
          .eq("equipo_id", equipo.id)

        const servidorIds = relaciones?.map((r) => r.servidor_id) || []

        if (servidorIds.length > 0) {
          const { data: servidores } = await supabase
            .from("servidores")
            .select("id, nombre_completo, celular, tipo_servidor, imagen")
            .in("id", servidorIds)

          return {
            ...equipo,
            servidores: servidores || [],
          }
        }

        return {
          ...equipo,
          servidores: [],
        }
      })
    )

    return NextResponse.json(equiposConServidores)
  } catch (error) {
    console.error("Error fetching equipos:", error)
    return NextResponse.json({ message: "Error al obtener equipos" }, { status: 500 })
  }
}
