"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MesasManagement } from "@/components/admin/mesas-management"
import { CaminantesManagement } from "@/components/admin/caminantes-management"
import { ServidoresManagement } from "@/components/admin/servidores-management"
import { EquiposManagement } from "@/components/admin/equipos-management"
import { ReportsManagement } from "@/components/admin/reports-management"
import { AdminsManagement } from "@/components/admin/admins-management"
import { MesaReport } from "@/components/admin/mesa-report"
import { SystemSettingsPanel } from "@/components/admin/system-settings-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Users, Table2, UserCog, FileText, UsersRound, ShieldCheck, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { AdminUser } from "@/lib/types"

interface AdminDashboardProps {
  adminUser: AdminUser
}

export function AdminDashboard({ adminUser }: AdminDashboardProps) {
  const router = useRouter()
  const [logoSrc, setLogoSrc] = useState("/logo.png")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLiderOrColider, setIsLiderOrColider] = useState(false)
  const [isCartasTeam, setIsCartasTeam] = useState(false)
  const [isSnacksTeam, setIsSnacksTeam] = useState(false)
  const [isLogisticaTeam, setIsLogisticaTeam] = useState(false)
  const [isAdditionalTeam, setIsAdditionalTeam] = useState(false)
  const [pagoServidor, setPagoServidor] = useState<{ text: string; status: "zero" | "partial" | "complete" } | null>(null)

  const getPaymentBadgeClass = (status: "zero" | "partial" | "complete") => {
    if (status === "zero") return "bg-red-100 text-red-800 border-red-300"
    if (status === "complete") return "bg-emerald-100 text-emerald-800 border-emerald-300"
    return "bg-amber-100 text-amber-800 border-amber-300"
  }

  const parseMoney = (value: unknown) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0
    if (typeof value === "string") {
      const digitsOnly = value.replace(/[^\d-]/g, "")
      const parsed = Number.parseInt(digitsOnly, 10)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch("/api/retiro-settings", { cache: "no-store" })
        if (!response.ok) return
        const settings = await response.json()
        if (settings?.logo_url) {
          setLogoSrc(settings.logo_url)
        }
      } catch {
        // Keep default logo on fetch errors
      }
    }

    const checkRoles = async () => {
      try {
        const res = await fetch("/api/servidores")
        const servidores = await res.json()

        // Check líder/colíder
        const isLC = servidores.some(
          (s: any) => s.auth_user_id === adminUser.id && 
          (s.tipo_servidor === 'lider' || s.tipo_servidor === 'colider') &&
          s.mesa_id
        )
        setIsLiderOrColider(isLC)

        // Check equipo memberships
        const myServidor = servidores.find((s: any) => s.auth_user_id === adminUser.id)
        if (myServidor) {
          const montoPagado = parseMoney(myServidor.monto_pagado)
          const montoTotal = parseMoney(myServidor.monto_total)
          const status = montoPagado <= 0 ? "zero" : montoPagado >= montoTotal ? "complete" : "partial"
          setPagoServidor({
            text: `$${montoPagado.toLocaleString("es-CO")} / $${montoTotal.toLocaleString("es-CO")}`,
            status,
          })
        }
        const myEquipos: string[] = (myServidor?.equipos || []).map((e: string) => e.normalize('NFC').toLowerCase())
        const equiposConPermisoDefinido = [
          'lideres y colideres',
          'líderes y colíderes',
          'cartas',
          'snacks',
          'cocina/snacks',
          'apoyo de mesas',
          'logistica',
          'logística',
        ]

        if (myEquipos.includes('cartas')) {
          setIsCartasTeam(true)
        }
        if (myEquipos.some((e: string) => e === 'snacks' || e === 'cocina/snacks' || e === 'apoyo de mesas')) {
          setIsSnacksTeam(true)
        }
        if (myEquipos.some((e: string) => e.includes('log'))) {
          setIsLogisticaTeam(true)
        }

        const hasDefinedPermissionTeam = myEquipos.some((e: string) => equiposConPermisoDefinido.includes(e))
        const hasAdditionalTeam = myEquipos.some((e: string) => !equiposConPermisoDefinido.includes(e))
        if (hasAdditionalTeam && !hasDefinedPermissionTeam) {
          setIsAdditionalTeam(true)
        }
      } catch (error) {
        console.error("Error checking roles:", error)
      }
    }
    
    if (!adminUser.is_super) {
      checkRoles()
    }

    loadLogo()
  }, [adminUser])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const hasMiMesaTab = !adminUser.is_super && isLiderOrColider && !isAdditionalTeam
  const hasReportesTab = adminUser.is_super || isCartasTeam || isSnacksTeam || isLogisticaTeam
  const tabCount = adminUser.is_super ? 6 : hasMiMesaTab || hasReportesTab ? 5 : 4
  const isReadOnlyByAdditionalTeam = !adminUser.is_super && isAdditionalTeam

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Image src={logoSrc} alt="El Camino de Emaús" width={40} height={40} className="object-contain flex-shrink-0 md:w-[50px] md:h-[50px]" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold truncate">Panel de Administración</h1>
                <div className="mt-0.5 flex flex-col items-start gap-1 text-xs md:text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
                  <span className="max-w-[170px] truncate sm:max-w-none">{adminUser.nombre_completo}</span>
                  {pagoServidor ? (
                    <Badge variant="secondary" className={getPaymentBadgeClass(pagoServidor.status)}>
                      {pagoServidor.text}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {adminUser.is_super && <SystemSettingsPanel />}
              <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut} size="sm" className="flex-shrink-0">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="equipos" className="space-y-6">
          <TabsList className={`grid w-full h-auto ${tabCount === 6 ? 'grid-cols-6' : tabCount === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
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
            {adminUser.is_super && (
              <TabsTrigger value="admins" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
                <ShieldCheck className="h-4 w-4 md:mr-0" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
            )}
            {hasMiMesaTab && (
              <TabsTrigger value="mi-mesa" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
                <ClipboardList className="h-4 w-4 md:mr-0" />
                <span className="hidden sm:inline">Mi Mesa</span>
              </TabsTrigger>
            )}
            {hasReportesTab && (
              <TabsTrigger value="reportes" className="flex-col gap-1 py-2 px-1 text-xs md:flex-row md:gap-2 md:py-2 md:px-3 md:text-sm">
                <FileText className="h-4 w-4 md:mr-0" />
                <span className="hidden sm:inline">Reportes</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="equipos">
            <EquiposManagement adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="mesas">
            <MesasManagement adminUser={adminUser} readOnly={isReadOnlyByAdditionalTeam} />
          </TabsContent>

          <TabsContent value="caminantes">
            <CaminantesManagement adminUser={adminUser} readOnly={isReadOnlyByAdditionalTeam} />
          </TabsContent>

          <TabsContent value="servidores">
            <ServidoresManagement adminUser={adminUser} readOnly={isReadOnlyByAdditionalTeam} />
          </TabsContent>

          {adminUser.is_super && (
            <TabsContent value="admins">
              <AdminsManagement />
            </TabsContent>
          )}

          {hasMiMesaTab && (
            <TabsContent value="mi-mesa">
              <MesaReport adminUser={adminUser} />
            </TabsContent>
          )}

          {hasReportesTab && (
            <TabsContent value="reportes">
              {adminUser.is_super || isLogisticaTeam ? (
                <ReportsManagement isSuperAdmin={adminUser.is_super} isLogisticaTeam={isLogisticaTeam} />
              ) : isCartasTeam ? (
                <ReportsManagement onlyCartas isSuperAdmin={adminUser.is_super} isLogisticaTeam={isLogisticaTeam} />
              ) : (
                <ReportsManagement onlyRestricciones isSuperAdmin={adminUser.is_super} isLogisticaTeam={isLogisticaTeam} />
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
