import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export async function isLogisticaMemberByAuthUserId(userId: string) {
  const service = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: servidor, error: servidorError } = await service
    .from("servidores")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle()

  if (servidorError || !servidor?.id) {
    return false
  }

  const { data: relaciones, error: relacionesError } = await service
    .from("servidor_equipo")
    .select("equipos(nombre)")
    .eq("servidor_id", servidor.id)

  if (relacionesError || !relaciones?.length) {
    return false
  }

  const equipos = relaciones
    .map((relacion: any) => relacion.equipos?.nombre)
    .filter((nombre: unknown): nombre is string => typeof nombre === "string")

  return equipos.some((equipo) => normalizeTeamName(equipo).includes("log"))
}
