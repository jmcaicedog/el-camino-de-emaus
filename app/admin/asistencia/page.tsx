import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AsistenciaDashboard } from "@/components/admin/asistencia/asistencia-dashboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { isLogisticaMemberByAuthUserId } from "@/lib/access-control"

export default async function AdminAsistenciaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: adminData } = await supabase
    .from("admin_users")
    .select("id, is_super")
    .eq("id", user.id)
    .maybeSingle()

  const isLogistica = await isLogisticaMemberByAuthUserId(user.id)

  if (!adminData?.is_super && !isLogistica) redirect("/admin")

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al panel principal
          </Link>
        </Button>
      </div>
      <AsistenciaDashboard />
    </main>
  )
}
