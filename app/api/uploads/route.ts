import { NextResponse } from "next/server"
import { createClient as createBrowserClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { dataUrl, filename } = await request.json()
    if (!dataUrl) return NextResponse.json({ message: "No data provided" }, { status: 400 })

    // dataUrl like: data:image/png;base64,AAAA
    const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/)
    if (!match) return NextResponse.json({ message: "Invalid data URL" }, { status: 400 })

    const mime = match[1]
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2]
    const base64 = match[3]
    // Create several representations to support different runtimes
    let nodeBuffer: Buffer | null = null
    let uint8: Uint8Array | null = null
    try {
      // Node Buffer if available
      // @ts-ignore
      nodeBuffer = Buffer.from(base64, 'base64')
      uint8 = new Uint8Array(nodeBuffer)
    } catch (e) {
      // Fallback for edge runtime
      const binary = atob(base64)
      uint8 = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i)
    }

    // Prefer to use the SERVICE_ROLE key server-side to bypass storage RLS for uploads.
    let supabase: any
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    } else {
      // Fallback: use server helper (anon key). This may fail due to RLS on storage.objects.
      // Return an instructive error to guide configuration.
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set — storage upload may fail due to RLS')
      return NextResponse.json({ message: 'Server misconfiguration: set SUPABASE_SERVICE_ROLE_KEY to allow server-side uploads or enable appropriate bucket policies.' }, { status: 500 })
    }

    const key = `avatars/${Date.now()}_${(filename || 'avatar').replace(/[^a-zA-Z0-9_.-]/g, '_')}.${ext}`

    let uploadError: any = null
    let uploadData: any = null

    // Try Node Buffer first
    try {
      if (nodeBuffer) {
        const res = await supabase.storage.from('avatars').upload(key, nodeBuffer, { contentType: mime, upsert: true })
        uploadData = res.data
        uploadError = res.error
      }
    } catch (e) {
      uploadError = e
      console.error('Upload attempt with Buffer failed', e)
    }

    // If previous failed, try Uint8Array / Blob
    if (uploadError) {
      try {
        let toUpload: any = uint8
        // If Blob is available in runtime, prefer Blob
        if (typeof Blob !== 'undefined') {
          // Cast buffer to any to satisfy TS in environments where ArrayBuffer types differ
          toUpload = new Blob([uint8!.buffer as any], { type: mime })
        }
        const res = await supabase.storage.from('avatars').upload(key, toUpload, { contentType: mime, upsert: true })
        uploadData = res.data
        uploadError = res.error
      } catch (e) {
        uploadError = e
        console.error('Upload attempt with Uint8Array/Blob failed', e)
      }
    }

    if (uploadError) {
      console.error('Final upload error', uploadError)
      return NextResponse.json({ message: uploadError?.message || String(uploadError) }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(key)

    return NextResponse.json({ url: publicUrl.publicUrl }, { status: 200 })
  } catch (e) {
    console.error('Error in uploads POST', e)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
