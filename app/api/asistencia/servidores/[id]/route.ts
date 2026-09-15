import { type NextRequest, NextResponse } from "next/server"
import { getServiceClient, requireSuperAdmin } from "../../utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin()
    if ("error" in auth) return auth.error

    const { id: servidorId } = await params
    const body = await request.json()
    const llego: boolean = Boolean(body.llego)
    const service = getServiceClient()

    const { error } = await service.from("asistencia_servidores").upsert(
      {
        servidor_id: servidorId,
        llego,
        llegada_at: llego ? new Date().toISOString() : null,
      },
      { onConflict: "servidor_id" }
    )

    if (error) throw error

    return NextResponse.json({ message: llego ? "Llegada registrada" : "Llegada desmarcada" })
  } catch (error) {
    console.error("[asistencia/servidores/[id]] PATCH error:", error)
    return NextResponse.json({ message: "Error al actualizar asistencia del servidor" }, { status: 500 })
  }
}
