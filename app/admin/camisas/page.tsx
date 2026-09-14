import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShirtsManagement } from "@/components/admin/shirts-management"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function AdminCamisasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: adminData } = await supabase
    .from("admin_users")
    .select("id, is_super")
    .eq("id", user.id)
    .maybeSingle()

  let canManage = Boolean(adminData?.is_super)
  if (!canManage) {
    const { data: servidor } = await supabase
      .from("servidores")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (servidor?.id) {
      const { data: memberships } = await supabase
        .from("servidor_equipo")
        .select("equipos(nombre)")
        .eq("servidor_id", servidor.id)

      canManage = (memberships || []).some((membership: any) => {
        const name = String(membership?.equipos?.nombre || "")
        return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("contabilidad")
      })
    }
  }

  if (!canManage) redirect("/admin")

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin" aria-label="Volver al panel principal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al panel principal
          </Link>
        </Button>
      </div>
      <ShirtsManagement />
    </main>
  )
}
