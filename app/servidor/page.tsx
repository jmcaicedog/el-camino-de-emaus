import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ServidorDashboard } from "@/components/servidor/servidor-dashboard"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export default async function ServidorPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get servidor data
  const { data: servidorData } = await supabase.from("servidores").select("*").eq("auth_user_id", user.id).single()

  if (!servidorData) {
    redirect("/auth/login")
  }

  const service = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const [{ data: asignacionAlojamiento }, { data: equipoMemberships }] = await Promise.all([
    service
      .from("asignaciones_alojamiento")
      .select("habitaciones(nombre, edificios(nombre))")
      .eq("persona_id", servidorData.id)
      .eq("persona_tipo", "servidor")
      .maybeSingle(),
    supabase.from("servidor_equipo").select("equipos (nombre)").eq("servidor_id", servidorData.id),
  ])

  const habitacion = (Array.isArray(asignacionAlojamiento?.habitaciones) ? asignacionAlojamiento?.habitaciones[0] : asignacionAlojamiento?.habitaciones) as unknown as {
    nombre: string
    edificios: { nombre: string } | null
  } | null
  const alojamiento = habitacion?.edificios
    ? { edificio_nombre: habitacion.edificios.nombre, habitacion_nombre: habitacion.nombre }
    : null

  const myEquipos = (equipoMemberships || [])
    .map((r: any) => (r.equipos?.nombre || '').normalize('NFC').toLowerCase())
    .filter(Boolean)
  const isCartasTeam = myEquipos.includes('cartas')
  const isSnacksTeam = myEquipos.some((e: string) => e === 'snacks' || e === 'cocina/snacks' || e === 'apoyo de mesas')
  const isLogisticaTeam = myEquipos.some((e: string) => e.includes('log'))

  // Get mesa data if assigned
  let mesaData = null
  let caminantesData: any[] = []
  let allMesas: any[] = []

  if (isCartasTeam) {
    // Cartas team sees ALL caminantes and mesas
    const { data: mesas } = await supabase.from("mesas").select("*").order("numero")
    allMesas = mesas || []

    const { data: caminantes } = await supabase.from("caminantes").select("*")
    caminantesData = caminantes || []
  } else if (servidorData.mesa_id) {
    const { data: mesa } = await supabase.from("mesas").select("*").eq("id", servidorData.mesa_id).single()
    mesaData = mesa

    const { data: caminantes } = await supabase.from("caminantes").select("*").eq("mesa_id", servidorData.mesa_id)
    caminantesData = caminantes || []
  }

  return (
    <ServidorDashboard
      servidor={{ ...servidorData, alojamiento }}
      mesa={mesaData}
      caminantes={caminantesData}
      isCartasTeam={isCartasTeam}
      isSnacksTeam={isSnacksTeam}
      isLogisticaTeam={isLogisticaTeam}
      allMesas={allMesas}
    />
  )
}
