import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ServidorDashboard } from "@/components/servidor/servidor-dashboard"

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

  // Get mesa data if assigned
  let mesaData = null
  let caminantesData = []

  if (servidorData.mesa_id) {
    const { data: mesa } = await supabase.from("mesas").select("*").eq("id", servidorData.mesa_id).single()

    mesaData = mesa

    const { data: caminantes } = await supabase.from("caminantes").select("*").eq("mesa_id", servidorData.mesa_id)

    caminantesData = caminantes || []
  }

  return <ServidorDashboard servidor={servidorData} mesa={mesaData} caminantes={caminantesData} />
}
