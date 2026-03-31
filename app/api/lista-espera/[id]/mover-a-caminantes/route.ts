import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { formatPersonName } from "@/lib/utils"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { buildNuevoCaminanteRegistradoNotification } from "@/lib/email/caminante-notification"
import { getRetiroSettings } from "@/lib/retiro-settings"

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return null
  const normalized = value.toLowerCase()
  if (normalized === "si" || normalized === "true") return true
  if (normalized === "no" || normalized === "false") return false
  return null
}

function parseAgeFromBirthDate(fechaNacimiento: unknown): number {
  if (typeof fechaNacimiento !== "string") return 0
  const birthDate = new Date(fechaNacimiento)
  if (Number.isNaN(birthDate.getTime())) return 0

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return Math.max(age, 0)
}

function buildCaminantePayload(waitItem: any, costoCaminante: number) {
  const formData = (waitItem?.form_data && typeof waitItem.form_data === "object") ? waitItem.form_data : {}

  const nombreCompleto = formatPersonName(formData.nombre_completo || waitItem?.nombre_completo || "")
  const celular = String(formData.celular || waitItem?.celular || "").trim()
  const correo = String(formData.correo || waitItem?.correo || "").trim().toLowerCase()

  if (!nombreCompleto || !celular || !correo) {
    return { error: "La persona en lista de espera no tiene la información mínima para registrarse" }
  }

  const payload = {
    ...formData,
    nombre_completo: nombreCompleto,
    celular,
    correo,
    edad: Number(formData.edad) || parseAgeFromBirthDate(formData.fecha_nacimiento),
    monto_total: Number(formData.monto_total) || costoCaminante,
    monto_pagado: Number(formData.monto_pagado) || 0,
    cartas_recibidas: Number(formData.cartas_recibidas) || 0,
    fotos_recibidas: Number(formData.fotos_recibidas) || 0,
    es_sorpresa: parseBoolean(formData.es_sorpresa) ?? false,
    ronca_al_dormir: parseBoolean(formData.ronca_al_dormir) ?? false,
    invitador_hizo_retiro: parseBoolean(formData.invitador_hizo_retiro),
    sacramentos_recibidos: Array.isArray(formData.sacramentos_recibidos) ? formData.sacramentos_recibidos : [],
    mesa_id: null,
  }

  return { payload }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const { data: waitItem, error: waitError } = await supabase
      .from("lista_espera")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (waitError) {
      return NextResponse.json({ message: waitError.message }, { status: 400 })
    }

    if (!waitItem) {
      return NextResponse.json({ message: "Registro no encontrado en lista de espera" }, { status: 404 })
    }

    const settings = await getRetiroSettings()
    const built = buildCaminantePayload(waitItem, settings.costo_caminante)
    if ("error" in built) {
      return NextResponse.json({ message: built.error }, { status: 400 })
    }

    const { data: insertedCaminante, error: insertError } = await supabase
      .from("caminantes")
      .insert([built.payload])
      .select()
      .single()
    if (insertError) {
      const message = /duplicate key|already exists|unique/i.test(insertError.message)
        ? "No se pudo trasladar porque ya existe un caminante con cédula o correo registrado"
        : insertError.message
      return NextResponse.json({ message }, { status: 409 })
    }

    const { error: deleteError } = await supabase.from("lista_espera").delete().eq("id", id)
    if (deleteError) {
      return NextResponse.json(
        { message: "Se registró como caminante, pero no se pudo eliminar de lista de espera" },
        { status: 500 },
      )
    }

    // Enviar la misma notificación que cuando un caminante se registra por su cuenta
    const notification = buildNuevoCaminanteRegistradoNotification(insertedCaminante)
    await sendEmailNotification({ to: [], ...notification })

    return NextResponse.json({ message: "Persona trasladada a caminantes registrados" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error moving waitlist item to caminantes:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
