import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TurnosSantisimoManagement } from "@/components/admin/turnos-santisimo-management"
import { getServidorAssignmentContext } from "@/lib/access-control"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function TurnosSantisimoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const context = await getServidorAssignmentContext(user.id)
  if (!context.canManageSantisimo) redirect("/admin")

  const { data: adminData } = await supabase.from("admin_users").select("id").eq("id", user.id).maybeSingle()

  return (
    <main className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 md:py-8">
      <div className="mb-5">
        <Button asChild variant="outline" size="sm">
          <Link href={adminData ? "/admin" : "/servidor"} aria-label="Volver al panel principal">
            <ArrowLeft className="mr-2 h-4 w-4" />Volver al panel principal
          </Link>
        </Button>
      </div>
      <TurnosSantisimoManagement />
    </main>
  )
}
