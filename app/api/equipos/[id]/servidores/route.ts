import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: servidores, error } = await supabase
      .from("servidor_equipo")
      .select(`
        servidor_id,
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

    const servidoresList = servidores?.map((r: any) => r.servidores).filter(Boolean) || []

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

    // Crear la relación
    const { error } = await supabase
      .from("servidor_equipo")
      .insert({ equipo_id: id, servidor_id })

    if (error) throw error

    return NextResponse.json({ message: "Servidor agregado al equipo exitosamente" })
  } catch (error) {
    console.error("Error adding servidor to equipo:", error)
    return NextResponse.json({ message: "Error al agregar servidor al equipo" }, { status: 500 })
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

    const { error } = await supabase
      .from("servidor_equipo")
      .delete()
      .eq("equipo_id", id)
      .eq("servidor_id", servidor_id)

    if (error) throw error

    return NextResponse.json({ message: "Servidor removido del equipo exitosamente" })
  } catch (error) {
    console.error("Error removing servidor from equipo:", error)
    return NextResponse.json({ message: "Error al remover servidor del equipo" }, { status: 500 })
  }
}
