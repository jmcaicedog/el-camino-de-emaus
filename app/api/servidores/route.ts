import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const { data, error } = await supabase.from("servidores").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching servidores:", error)
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in GET /api/servidores:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
