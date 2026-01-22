"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MesasManagement } from "@/components/admin/mesas-management"
import { CaminantesManagement } from "@/components/admin/caminantes-management"
import { ServidoresManagement } from "@/components/admin/servidores-management"
import { EquiposManagement } from "@/components/admin/equipos-management"
import { ReportsManagement } from "@/components/admin/reports-management"
import { Button } from "@/components/ui/button"
import { LogOut, Users, Table2, UserCog, FileText, UsersRound } from "lucide-react"
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Image src="/logo.png" alt="El Camino de Emaús" width={40} height={40} className="object-contain flex-shrink-0 md:w-[50px] md:h-[50px]" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold truncate">Panel de Administración</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Bienvenido, {adminUser.nombre_completo}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut} size="sm" className="flex-shrink-0">
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="equipos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="equipos" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
              <UsersRound className="h-4 w-4 md:mr-0" />
              <span className="hidden sm:inline">Equipos</span>
            </TabsTrigger>
            <TabsTrigger value="mesas" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
              <Table2 className="h-4 w-4 md:mr-0" />
              <span className="hidden sm:inline">Mesas</span>
            </TabsTrigger>
            <TabsTrigger value="caminantes" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
              <Users className="h-4 w-4 md:mr-0" />
              <span className="hidden sm:inline">Caminantes</span>
            </TabsTrigger>
            <TabsTrigger value="servidores" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
              <UserCog className="h-4 w-4 md:mr-0" />
              <span className="hidden sm:inline">Servidores</span>
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
              <FileText className="h-4 w-4 md:mr-0" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipos">
            <EquiposManagement />
          </TabsContent>

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
