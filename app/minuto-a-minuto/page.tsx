import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MinutoDashboard } from "@/components/minuto-a-minuto/minuto-dashboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MinutoAMinutoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verificar si es admin o servidor para la ruta de retorno
  const { data: adminData } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  const backUrl = adminData ? "/admin" : "/servidor"

  return (
    <main className="container mx-auto px-3 sm:px-4 py-6 md:py-8 max-w-7xl">
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href={backUrl} aria-label="Volver al panel principal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al panel principal
          </Link>
        </Button>
      </div>
      <MinutoDashboard />
    </main>
  )
}
