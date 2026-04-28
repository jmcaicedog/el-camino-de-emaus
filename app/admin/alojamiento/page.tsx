import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AlojamientoDashboard } from "@/components/admin/alojamiento/alojamiento-dashboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function AdminAlojamientoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: adminData } = await supabase.from("admin_users").select("id, is_super").eq("id", user.id).maybeSingle()

  if (!adminData?.is_super) {
    redirect("/admin")
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/admin" aria-label="Volver al panel principal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al panel principal
          </Link>
        </Button>
      </div>
      <AlojamientoDashboard />
    </main>
  )
}
