import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification } from "@/lib/email/send-notification"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

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
        <li><strong>Edad:</strong> ${data.edad} años</li>
        <li><strong>Retiros anteriores:</strong> ${data.retiros_anteriores || 0}</li>
      </ul>
      <p>Revisa la plataforma para más detalles.</p>
    `
    
    // Solo enviar a superadmins (to vacío, includeSuperAdmins por defecto es true)
    await sendEmailNotification({ to: [], subject, text, html })

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

    // Para cada servidor, obtener sus equipos
    const servidoresConEquipos = await Promise.all(
      (servidores || []).map(async (servidor) => {
        const { data: relaciones } = await supabase
          .from("servidor_equipo")
          .select(`
            equipos (
              nombre
            )
          `)
          .eq("servidor_id", servidor.id)

        const equipos = relaciones?.map((r: any) => r.equipos?.nombre).filter(Boolean) || []

        return {
          ...servidor,
          equipos,
        }
      })
    )

    return NextResponse.json(servidoresConEquipos, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/servidores:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
