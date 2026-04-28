import { type NextRequest, NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "../utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin()
    if ("error" in auth) return auth.error

    const { id: caminanteId } = await params
    const body = await request.json()
    const llego: boolean = Boolean(body.llego)

    const service = getServiceClient()

    const { error } = await service.from("asistencia_caminantes").upsert(
      {
        caminante_id: caminanteId,
        llego,
        llegada_at: llego ? new Date().toISOString() : null,
      },
      { onConflict: "caminante_id" }
    )

    if (error) throw error

    return NextResponse.json({ message: llego ? "Llegada registrada" : "Llegada desmarcada" })
  } catch (error) {
    console.error("[asistencia/[id]] PATCH error:", error)
    return NextResponse.json({ message: "Error al actualizar asistencia" }, { status: 500 })
  }
}
