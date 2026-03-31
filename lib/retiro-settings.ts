import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { MAX_CAMINANTES } from "@/lib/caminantes-capacity"

export interface RetiroSettings {
  retiro_datetime: string
  logo_url: string | null
  mesas_count: number
  caminantes_por_mesa: number
  max_caminantes: number
  costo_servidor: number
  costo_caminante: number
  countdown_enabled: boolean
}

export const DEFAULT_RETIRO_SETTINGS: RetiroSettings = {
  retiro_datetime: "2026-04-10T16:00:00-05:00",
  logo_url: null,
  mesas_count: 12,
  caminantes_por_mesa: 7,
  max_caminantes: MAX_CAMINANTES,
  costo_servidor: 400000,
  costo_caminante: 490000,
  countdown_enabled: true,
}

function getServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function normalizeSettings(input: Partial<RetiroSettings> | null | undefined): RetiroSettings {
  return {
    retiro_datetime: input?.retiro_datetime || DEFAULT_RETIRO_SETTINGS.retiro_datetime,
    logo_url: input?.logo_url ?? DEFAULT_RETIRO_SETTINGS.logo_url,
    mesas_count: Number(input?.mesas_count) || DEFAULT_RETIRO_SETTINGS.mesas_count,
    caminantes_por_mesa: Math.max(1, Number(input?.caminantes_por_mesa) || DEFAULT_RETIRO_SETTINGS.caminantes_por_mesa),
    max_caminantes: Number(input?.max_caminantes) || DEFAULT_RETIRO_SETTINGS.max_caminantes,
    costo_servidor: Number(input?.costo_servidor) || DEFAULT_RETIRO_SETTINGS.costo_servidor,
    costo_caminante: Number(input?.costo_caminante) || DEFAULT_RETIRO_SETTINGS.costo_caminante,
    countdown_enabled:
      typeof input?.countdown_enabled === "boolean"
        ? input.countdown_enabled
        : DEFAULT_RETIRO_SETTINGS.countdown_enabled,
  }
}

export async function getRetiroSettings(): Promise<RetiroSettings> {
  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase.from("retiro_settings").select("*").eq("id", 1).maybeSingle()

    if (error) {
      console.error("[v0] Error loading retiro settings:", error)
      return DEFAULT_RETIRO_SETTINGS
    }

    return normalizeSettings(data)
  } catch (error) {
    console.error("[v0] Error in getRetiroSettings:", error)
    return DEFAULT_RETIRO_SETTINGS
  }
}

export async function upsertRetiroSettings(nextSettings: Partial<RetiroSettings>): Promise<RetiroSettings> {
  const supabase = getServiceClient()
  const merged = normalizeSettings(nextSettings)

  const { data, error } = await supabase
    .from("retiro_settings")
    .upsert({ id: 1, ...merged }, { onConflict: "id" })
    .select()
    .single()

  if (error) throw error
  return normalizeSettings(data)
}
