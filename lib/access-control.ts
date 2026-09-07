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

export async function isMinutoFullAccessUser(userId: string) {
  const service = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: adminData } = await service
    .from("admin_users")
    .select("is_super")
    .eq("id", userId)
    .maybeSingle()

  if (adminData?.is_super) {
    return true
  }

  const { data: servidor } = await service
    .from("servidores")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle()

  if (!servidor?.id) {
    return false
  }

  const { data: relaciones } = await service
    .from("servidor_equipo")
    .select("equipos(nombre)")
    .eq("servidor_id", servidor.id)

  if (!relaciones?.length) {
    return false
  }

  const equipos = relaciones
    .map((relacion: any) => relacion.equipos?.nombre)
    .filter((nombre: unknown): nombre is string => typeof nombre === "string")

  return equipos.some((equipo) => {
    const norm = normalizeTeamName(equipo)
    return norm.includes("log") || norm.includes("minuto") || norm.includes("campan")
  })
}

export async function getServidorAssignmentContext(userId: string) {
  const service = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: adminData } = await service
    .from("admin_users")
    .select("is_super")
    .eq("id", userId)
    .maybeSingle()

  const isSuper = !!adminData?.is_super

  const { data: servidor } = await service
    .from("servidores")
    .select("id, nombre_completo")
    .eq("auth_user_id", userId)
    .maybeSingle()

  if (!servidor?.id) {
    return {
      servidorId: null,
      servidorNombre: null,
      equipoIds: [] as string[],
      isSuper,
      isFullViewer: isSuper,
    }
  }

  const { data: relaciones } = await service
    .from("servidor_equipo")
    .select("equipo_id, equipos(nombre)")
    .eq("servidor_id", servidor.id)

  const equipoIds: string[] = []
  const equipoNombres: string[] = []

  if (relaciones) {
    for (const r of relaciones as any[]) {
      if (r.equipo_id) equipoIds.push(r.equipo_id)
      if (r.equipos?.nombre) equipoNombres.push(r.equipos.nombre)
    }
  }

  const isFullViewer =
    isSuper ||
    equipoNombres.some((nombre) => {
      const norm = normalizeTeamName(nombre)
      return norm.includes("log") || norm.includes("minuto") || norm.includes("campan")
    })

  return {
    servidorId: servidor.id,
    servidorNombre: servidor.nombre_completo,
    equipoIds,
    isSuper,
    isFullViewer,
  }
}
