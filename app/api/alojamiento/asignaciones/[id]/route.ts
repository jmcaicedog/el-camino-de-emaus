import { type NextRequest, NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "@/app/api/alojamiento/utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const service = getServiceClient()

    const { error } = await service.from("asignaciones_alojamiento").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/alojamiento/asignaciones/[id]:", error)
    return NextResponse.json({ message: "Error al eliminar asignación" }, { status: 500 })
  }
}
