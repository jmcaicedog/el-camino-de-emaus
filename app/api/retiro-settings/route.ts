import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRetiroSettings, upsertRetiroSettings } from "@/lib/retiro-settings"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const settings = await getRetiroSettings()
    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/retiro-settings:", error)
    return NextResponse.json({ message: "Error al consultar la configuración" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    if (!currentUser) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("is_super")
      .eq("id", currentUser.id)
      .maybeSingle()

    if (!adminRecord?.is_super) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    let nextLogoUrl = body?.logo_url ?? null

    if (typeof nextLogoUrl === "string" && nextLogoUrl.startsWith("data:")) {
      const match = nextLogoUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/)
      if (!match) {
        return NextResponse.json({ message: "Formato de imagen inválido" }, { status: 400 })
      }

      const mime = match[1]
      const ext = match[2] === "jpeg" ? "jpg" : match[2]
      const base64 = match[3]
      const buffer = Buffer.from(base64, "base64")
      const MAX_BYTES = 2 * 1024 * 1024

      if (buffer.length > MAX_BYTES) {
        return NextResponse.json({ message: "Logo muy grande (max 2MB)" }, { status: 400 })
      }

      const service = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      const key = `logos/${Date.now()}_retiro.${ext}`
      const { error: uploadError } = await service.storage.from("avatars").upload(key, buffer, {
        contentType: mime,
        upsert: true,
      })

      if (uploadError) {
        return NextResponse.json({ message: uploadError.message }, { status: 500 })
      }

      const { data: publicUrl } = service.storage.from("avatars").getPublicUrl(key)
      nextLogoUrl = publicUrl.publicUrl
    }

    const updated = await upsertRetiroSettings({
      retiro_datetime: body?.retiro_datetime,
      logo_url: nextLogoUrl,
      mesas_count: body?.mesas_count,
      caminantes_por_mesa: body?.caminantes_por_mesa,
      max_caminantes: body?.max_caminantes,
      costo_servidor: body?.costo_servidor,
      costo_caminante: body?.costo_caminante,
      countdown_enabled: body?.countdown_enabled,
    })

    // Mantener consistencia en listados: sincronizar siempre monto_total existente.
    const service = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const desiredMesasCount = Math.max(1, Number(updated.mesas_count) || 12)
    const { data: existingMesas, error: existingMesasError } = await service.from("mesas").select("numero")

    if (existingMesasError) {
      console.error("[v0] Error loading mesas for sync:", existingMesasError)
      return NextResponse.json({ message: "Configuración guardada, pero falló sincronización de mesas" }, { status: 500 })
    }

    const existingNumbers = new Set((existingMesas ?? []).map((m) => Number(m.numero)))
    const missingMesas: Array<{ numero: number }> = []

    for (let numero = 1; numero <= desiredMesasCount; numero += 1) {
      if (!existingNumbers.has(numero)) {
        missingMesas.push({ numero })
      }
    }

    if (missingMesas.length > 0) {
      const { error: upsertMesasError } = await service.from("mesas").upsert(missingMesas, { onConflict: "numero" })
      if (upsertMesasError) {
        console.error("[v0] Error creating missing mesas:", upsertMesasError)
        return NextResponse.json({ message: "Configuración guardada, pero falló creación de mesas" }, { status: 500 })
      }
    }

    const { error: caminantesError } = await service
      .from("caminantes")
      .update({ monto_total: updated.costo_caminante })
      .not("id", "is", null)

    if (caminantesError) {
      console.error("[v0] Error syncing caminantes monto_total:", caminantesError)
      return NextResponse.json({ message: "Configuración guardada, pero falló sincronización de caminantes" }, { status: 500 })
    }

    const { error: servidoresError } = await service
      .from("servidores")
      .update({ monto_total: updated.costo_servidor })
      .not("id", "is", null)

    if (servidoresError) {
      console.error("[v0] Error syncing servidores monto_total:", servidoresError)
      return NextResponse.json({ message: "Configuración guardada, pero falló sincronización de servidores" }, { status: 500 })
    }

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in PUT /api/retiro-settings:", error)
    return NextResponse.json({ message: "Error al guardar la configuración" }, { status: 500 })
  }
}
