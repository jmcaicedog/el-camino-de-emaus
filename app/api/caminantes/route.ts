import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { buildNuevoCaminanteRegistradoNotification } from "@/lib/email/caminante-notification"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { isCaminanteRegistrationOpen } from "@/lib/caminantes-capacity"
import { buildPublicRegistrationErrorResponse } from "@/lib/public-registration-errors"
import { getRetiroSettings } from "@/lib/retiro-settings"
import { formatPersonName } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    body.nombre_completo = formatPersonName(body.nombre_completo)
    
    // Usar Service Role Key para bypasear RLS en registro público
    // Esto permite que usuarios anónimos puedan registrarse sin autenticación
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // If imagen is a data URL, upload to Storage and replace with public URL
    if (body.imagen && typeof body.imagen === 'string' && body.imagen.startsWith('data:')) {
      const match = body.imagen.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/)
      if (match) {
        const mime = match[1]
        const ext = match[2] === 'jpeg' ? 'jpg' : match[2]
        const base64 = match[3]
        const buffer = Buffer.from(base64, 'base64')
        const MAX_BYTES = 2 * 1024 * 1024 // 2MB
        if (buffer.length > MAX_BYTES) {
          return NextResponse.json({ message: 'Imagen muy grande (max 2MB)' }, { status: 400 })
        }

        const key = `avatars/${Date.now()}_caminante.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(key, buffer, { contentType: mime, upsert: true })
        if (uploadError) {
          console.error('Upload error', uploadError)
          return NextResponse.json({ message: uploadError.message }, { status: 500 })
        }
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(key)
        body.imagen = publicUrl.publicUrl
      } else {
        // invalid data url
        return NextResponse.json({ message: 'Formato de imagen inválido' }, { status: 400 })
      }
    }

    // Enforce available slots for caminantes. If capacity is full, stop public registration.
    const { count, error: countError } = await supabase
      .from("caminantes")
      .select("id", { count: "exact", head: true })

    if (countError) {
      console.error("[v0] Error counting caminantes:", countError)
      return NextResponse.json({ message: "No fue posible validar el cupo disponible" }, { status: 500 })
    }

    const currentCount = count ?? 0
    const settings = await getRetiroSettings()

    if (!settings.caminante_form_enabled) {
      return NextResponse.json(
        { message: "El registro de caminantes está deshabilitado temporalmente por administración." },
        { status: 403 },
      )
    }

    if (!isCaminanteRegistrationOpen(currentCount, settings.max_caminantes)) {
      return NextResponse.json(
        {
          message: "Nuestro cupo para este retiro se ha completado. Déjanos tus datos para agregarte a una lista de espera.",
          currentCount,
          maxCupo: settings.max_caminantes,
        },
        { status: 409 },
      )
    }

    body.monto_total = settings.costo_caminante

    // Insert caminante (no auth required for public registration)
    const { data, error } = await supabase.from("caminantes").insert([body]).select().single()

    if (error) {
      console.error("[v0] Error inserting caminante:", error)
      const errorResponse = buildPublicRegistrationErrorResponse(error, "caminante")
      return NextResponse.json(
        { message: errorResponse.message, code: errorResponse.code },
        { status: errorResponse.status },
      )
    }

    // Enviar notificación a superadmins sobre nuevo registro
    const notification = buildNuevoCaminanteRegistradoNotification(data)
    
    // Solo enviar a superadmins (to vacío, includeSuperAdmins por defecto es true)
    const notificationSent = await sendEmailNotification({ to: [], ...notification })
    if (!notificationSent) {
      console.warn(`[API] Email notification was not sent for caminante ${data.id}`)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/caminantes:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // This will be protected by RLS - only admins and servidores can view
    const { data, error } = await supabase.from("caminantes").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching caminantes:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    const normalized = (data || []).map((c) => ({
      ...c,
      nombre_completo: formatPersonName(c.nombre_completo),
    }))

    return NextResponse.json(normalized, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/caminantes:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
