"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MesasManagement } from "@/components/admin/mesas-management"
import { CaminantesManagement } from "@/components/admin/caminantes-management"
import { ServidoresManagement } from "@/components/admin/servidores-management"
import { ReportsManagement } from "@/components/admin/reports-management"
import { Button } from "@/components/ui/button"
import { LogOut, Users, Table2, UserCog, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { AdminUser } from "@/lib/types"

interface AdminDashboardProps {
  adminUser: AdminUser
}

export function AdminDashboard({ adminUser }: AdminDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="El Camino de Emaús" width={50} height={50} className="object-contain" />
              <div>
                <h1 className="text-2xl font-bold">Panel de Administración</h1>
                <p className="text-sm text-muted-foreground">Bienvenido, {adminUser.nombre_completo}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="mesas" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="mesas">
              <Table2 className="mr-2 h-4 w-4" />
              Mesas
            </TabsTrigger>
            <TabsTrigger value="caminantes">
              <Users className="mr-2 h-4 w-4" />
              Caminantes
            </TabsTrigger>
            <TabsTrigger value="servidores">
              <UserCog className="mr-2 h-4 w-4" />
              Servidores
            </TabsTrigger>
            <TabsTrigger value="reportes">
              <FileText className="mr-2 h-4 w-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mesas">
            <MesasManagement adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="caminantes">
            <CaminantesManagement adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="servidores">
            <ServidoresManagement adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="reportes">
            <ReportsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
