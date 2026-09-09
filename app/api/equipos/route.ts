import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { formatPersonName } from "@/lib/utils"

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
        const { data: relaciones, error: relacionesError } = await supabase
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
          .eq("equipo_id", equipo.id)

        if (relacionesError) throw relacionesError

        return {
          ...equipo,
          servidores: (relaciones || [])
            .map((relacion: any) => relacion.servidores ? ({
              ...relacion.servidores,
              nombre_completo: formatPersonName(relacion.servidores.nombre_completo),
              es_lider_equipo: relacion.es_lider,
            }) : null)
            .filter(Boolean),
        }
      })
    )

    return NextResponse.json(equiposConServidores)
  } catch (error) {
    console.error("Error fetching equipos:", error)
    return NextResponse.json({ message: "Error al obtener equipos" }, { status: 500 })
  }
}
