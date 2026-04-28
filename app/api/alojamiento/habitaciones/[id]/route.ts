import { type NextRequest, NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "@/app/api/alojamiento/utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : ""
    const camasTotal = Number(body?.camas_total)

    if (!nombre) {
      return NextResponse.json({ message: "El nombre de la habitación es obligatorio" }, { status: 400 })
    }

    if (!Number.isInteger(camasTotal) || camasTotal < 1) {
      return NextResponse.json({ message: "La cantidad de camas debe ser un entero mayor a 0" }, { status: 400 })
    }

    const service = getServiceClient()

    const { data: maxAssigned, error: maxAssignedError } = await service
      .from("asignaciones_alojamiento")
      .select("cama_numero")
      .eq("habitacion_id", id)
      .order("cama_numero", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxAssignedError) {
      return NextResponse.json({ message: maxAssignedError.message }, { status: 400 })
    }

    const maxAssignedBed = Number(maxAssigned?.cama_numero || 0)
    if (maxAssignedBed > camasTotal) {
      return NextResponse.json(
        { message: "No puedes reducir las camas por debajo de una cama ya asignada" },
        { status: 409 },
      )
    }

    const { data, error } = await service
      .from("habitaciones")
      .update({ nombre, camas_total: camasTotal })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in PUT /api/alojamiento/habitaciones/[id]:", error)
    return NextResponse.json({ message: "Error al actualizar habitación" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const service = getServiceClient()

    const { error } = await service.from("habitaciones").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/alojamiento/habitaciones/[id]:", error)
    return NextResponse.json({ message: "Error al eliminar habitación" }, { status: 500 })
  }
}
