import { type NextRequest, NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "@/app/api/alojamiento/utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const edificioId = typeof body?.edificio_id === "string" ? body.edificio_id : ""
    const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : ""
    const camasTotal = Number(body?.camas_total)

    if (!edificioId) {
      return NextResponse.json({ message: "El edificio es obligatorio" }, { status: 400 })
    }

    if (!nombre) {
      return NextResponse.json({ message: "El nombre de la habitación es obligatorio" }, { status: 400 })
    }

    if (!Number.isInteger(camasTotal) || camasTotal < 1) {
      return NextResponse.json({ message: "La cantidad de camas debe ser un entero mayor a 0" }, { status: 400 })
    }

    const service = getServiceClient()

    const { data, error } = await service
      .from("habitaciones")
      .insert([{ edificio_id: edificioId, nombre, camas_total: camasTotal }])
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/alojamiento/habitaciones:", error)
    return NextResponse.json({ message: "Error al crear habitación" }, { status: 500 })
  }
}
