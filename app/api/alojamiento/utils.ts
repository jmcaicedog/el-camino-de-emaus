import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

export function getServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function requireSuperAdmin() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const currentUser = userData?.user

  if (!currentUser) {
    return { error: NextResponse.json({ message: "No autenticado" }, { status: 401 }) }
  }

  const { data: adminRecord } = await supabase.from("admin_users").select("is_super").eq("id", currentUser.id).maybeSingle()

  if (!adminRecord?.is_super) {
    return { error: NextResponse.json({ message: "No autorizado" }, { status: 403 }) }
  }

  return { user: currentUser }
}
