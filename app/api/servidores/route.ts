import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { formatPersonName } from "@/lib/utils"
import { getRetiroSettings } from "@/lib/retiro-settings"

// Campos permitidos en el registro público. Excluye deliberadamente monto_pagado,
// mesa_id, auth_user_id y tipo_servidor: son controlados solo por administración
// para evitar que un registro fraudulento se auto-asigne pagos, mesa o rol de líder.
const ALLOWED_SERVIDOR_FIELDS = [
  "nombre_completo",
  "cedula",
  "fecha_nacimiento",
  "edad",
  "celular",
  "correo",
  "direccion",
  "ciudad",
  "estado_civil",
  "profesion",
  "empresa",
  "cargo",
  "talla_camisa",
  "colores_camisa",
  "nombre_contacto_emergencia",
  "parentesco_contacto",
  "celular_contacto",
  "nombre_contacto_emergencia_2",
  "parentesco_contacto_2",
  "celular_contacto_2",
  "condicion_especial",
  "medicamentos",
  "restricciones_alimenticias",
  "parroco",
  "ronca_al_dormir",
  "eps",
  "tipo_sangre",
  "parroquia",
  "retiros_anteriores",
  "experiencia_servicio",
  "imagen",
] as const

function sanitizeServidorInput(raw: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {}
  for (const field of ALLOWED_SERVIDOR_FIELDS) {
    if (raw[field] !== undefined) sanitized[field] = raw[field]
  }
  return sanitized
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const body = sanitizeServidorInput(rawBody)
    body.nombre_completo = formatPersonName(body.nombre_completo as string)
    const settings = await getRetiroSettings()
    body.monto_total = settings.costo_servidor
    
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

        const key = `avatars/${Date.now()}_servidor.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(key, buffer, { contentType: mime, upsert: true })
        if (uploadError) {
          console.error('Upload error', uploadError)
          return NextResponse.json({ message: uploadError.message }, { status: 500 })
        }
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(key)
        body.imagen = publicUrl.publicUrl
      } else {
        return NextResponse.json({ message: 'Formato de imagen inválido' }, { status: 400 })
      }
    }

    // Insert servidor (no auth required for public registration)
    const { data, error } = await supabase.from("servidores").insert([body]).select().single()

    if (error) {
      console.error("[v0] Error inserting servidor:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Enviar notificación a superadmins sobre nuevo registro
    const subject = 'Nuevo servidor registrado'
    const text = `Se ha registrado un nuevo servidor en la plataforma.\n\nNombre: ${data.nombre_completo}\nCédula: ${data.cedula}\nCelular: ${data.celular}\nCorreo: ${data.correo}\nEdad: ${data.edad} años\nRetiros anteriores: ${data.retiros_anteriores || 0}\n\nRevisa la plataforma para más detalles.`
    const html = `
      <h2>Nuevo servidor registrado</h2>
      <p>Se ha registrado un nuevo servidor en la plataforma:</p>
      <ul>
        <li><strong>Nombre:</strong> ${data.nombre_completo}</li>
        <li><strong>Cédula:</strong> ${data.cedula}</li>
        <li><strong>Celular:</strong> ${data.celular}</li>
        <li><strong>Correo:</strong> ${data.correo}</li>
      </ul>
      <p>Revisa la plataforma para más detalles.</p>
    `
    
    // Solo enviar a superadmins (to vacío, includeSuperAdmins por defecto es true)
    const notificationSent = await sendEmailNotification({ to: [], subject, text, html })
    if (!notificationSent) {
      console.warn(`[API] Email notification was not sent for servidor ${data.id}`)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/servidores:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // This will be protected by RLS - only admins can view all servidores
    const { data: servidores, error } = await supabase.from("servidores").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching servidores:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Para cada servidor, obtener sus equipos y actividades
    const servidoresConEquipos = await Promise.all(
      (servidores || []).map(async (servidor) => {
        const { data: relaciones } = await supabase
          .from("servidor_equipo")
          .select(`
            equipos (
              nombre,
              tipo
            )
          `)
          .eq("servidor_id", servidor.id)

        const equipos = relaciones?.map((r: any) => r.equipos?.nombre).filter(Boolean) || []
        const equiposPorTipo = relaciones?.map((r: any) => ({
          nombre: r.equipos?.nombre,
          tipo: r.equipos?.tipo
        })).filter((e: any) => e.nombre) || []

        return {
          ...servidor,
          nombre_completo: formatPersonName(servidor.nombre_completo),
          equipos,
          equiposPorTipo,
        }
      })
    )

    return NextResponse.json(servidoresConEquipos, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/servidores:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
