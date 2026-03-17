import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification } from "@/lib/email/send-notification"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { MAX_CAMINANTES, isCaminanteRegistrationOpen } from "@/lib/caminantes-capacity"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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
    if (!isCaminanteRegistrationOpen(currentCount)) {
      return NextResponse.json(
        {
          message: "Nuestro cupo para este retiro se ha completado. Déjanos tus datos para agregarte a una lista de espera.",
          currentCount,
          maxCupo: MAX_CAMINANTES,
        },
        { status: 409 },
      )
    }

    // Insert caminante (no auth required for public registration)
    const { data, error } = await supabase.from("caminantes").insert([body]).select().single()

    if (error) {
      console.error("[v0] Error inserting caminante:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Enviar notificación a superadmins sobre nuevo registro
    const subject = 'Nuevo caminante registrado'
    const text = `Se ha registrado un nuevo caminante en la plataforma.\n\nNombre: ${data.nombre_completo}\nCédula: ${data.cedula}\nCelular: ${data.celular}\nCorreo: ${data.correo}\nEdad: ${data.edad} años\n\nRevisa la plataforma para más detalles.`
    const html = `
      <h2>Nuevo caminante registrado</h2>
      <p>Se ha registrado un nuevo caminante en la plataforma:</p>
      <ul>
        <li><strong>Nombre:</strong> ${data.nombre_completo}</li>
        <li><strong>Cédula:</strong> ${data.cedula}</li>
        <li><strong>Celular:</strong> ${data.celular}</li>
        <li><strong>Correo:</strong> ${data.correo}</li>
        <li><strong>Edad:</strong> ${data.edad} años</li>
      </ul>
      <p>Revisa la plataforma para más detalles.</p>
    `
    
    // Solo enviar a superadmins (to vacío, includeSuperAdmins por defecto es true)
    await sendEmailNotification({ to: [], subject, text, html })

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

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/caminantes:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
