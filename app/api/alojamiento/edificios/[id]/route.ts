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

    if (!nombre) {
      return NextResponse.json({ message: "El nombre del edificio es obligatorio" }, { status: 400 })
    }

    const service = getServiceClient()
    const { data, error } = await service.from("edificios").update({ nombre }).eq("id", id).select("*").single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in PUT /api/alojamiento/edificios/[id]:", error)
    return NextResponse.json({ message: "Error al actualizar edificio" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const service = getServiceClient()

    const { error } = await service.from("edificios").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/alojamiento/edificios/[id]:", error)
    return NextResponse.json({ message: "Error al eliminar edificio" }, { status: 500 })
  }
}
