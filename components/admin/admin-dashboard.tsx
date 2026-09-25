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
import { Card, CardContent } from "@/components/ui/card"
import { CalendarClock, ChevronDown, Clock3, LogOut, Users, Table2, UserCog, FileText, UsersRound, ShieldCheck, ClipboardList, Building2, ClipboardCheck, Timer, Shirt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { AdminUser } from "@/lib/types"
import type { TurnoSantisimo } from "@/lib/types"
import { formatSantisimoTurn } from "@/lib/santisimo-turnos"

interface AdminDashboardProps {
  adminUser: AdminUser
}

export function AdminDashboard({ adminUser }: AdminDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("equipos")
  const [logoSrc, setLogoSrc] = useState("/logo.png")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLiderOrColider, setIsLiderOrColider] = useState(false)
  const [isCartasTeam, setIsCartasTeam] = useState(false)
  const [isSnacksTeam, setIsSnacksTeam] = useState(false)
  const [isLogisticaTeam, setIsLogisticaTeam] = useState(false)
  const [isContabilidadTeam, setIsContabilidadTeam] = useState(false)
  const [isMesaRegistroTeam, setIsMesaRegistroTeam] = useState(false)
  const [canManageSantisimo, setCanManageSantisimo] = useState(false)
  const [isAdditionalTeam, setIsAdditionalTeam] = useState(false)
  const [pagoServidor, setPagoServidor] = useState<{ text: string; status: "zero" | "partial" | "complete" } | null>(null)
  const [alojamientoServidor, setAlojamientoServidor] = useState<{ edificio_nombre: string; habitacion_nombre: string } | null>(null)
  const [turnosSantisimo, setTurnosSantisimo] = useState<TurnoSantisimo[]>([])

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
        const res = await fetch("/api/servidores/me")
        if (!res.ok) throw new Error("No fue posible consultar el perfil del servidor")
        const myServidor = await res.json()

        setIsLiderOrColider(
          Boolean(
            myServidor?.mesa_id &&
              (myServidor.tipo_servidor === "lider" || myServidor.tipo_servidor === "colider"),
          ),
        )

        if (myServidor) {
          const montoPagado = parseMoney(myServidor.monto_pagado)
          const montoTotal = parseMoney(myServidor.monto_total)
          const status = montoPagado <= 0 ? "zero" : montoPagado >= montoTotal ? "complete" : "partial"
          setPagoServidor({
            text: `$${montoPagado.toLocaleString("es-CO")} / $${montoTotal.toLocaleString("es-CO")}`,
            status,
          })
          setAlojamientoServidor(myServidor.alojamiento || null)
          setCanManageSantisimo(Boolean(myServidor.can_manage_santisimo))
          setTurnosSantisimo(myServidor.turnos_santisimo || [])
        }
        const myEquipos: string[] = (myServidor?.equipos || []).map((e: string) => e.normalize('NFC').toLowerCase())
        const equiposConPermisoDefinido = [
          'lideres y colideres',
          'líderes y colíderes',
          'mesa de registro',
          'cartas',
          'snacks',
          'cocina/snacks',
          'apoyo de mesas',
          'logistica',
          'logística',
          'contabilidad',
        ]

        if (myEquipos.includes('cartas')) {
          setIsCartasTeam(true)
        }
        if (myEquipos.some((e: string) => e === 'snacks' || e === 'cocina/snacks' || e === 'apoyo de mesas')) {
          setIsSnacksTeam(true)
        }
        if (myEquipos.includes('mesa de registro')) {
          setIsMesaRegistroTeam(true)
        }
        if (myEquipos.some((e: string) => e.includes('log'))) {
          setIsLogisticaTeam(true)
        }
        if (myEquipos.includes('contabilidad')) {
          setIsContabilidadTeam(true)
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
    
    checkRoles()

    loadLogo()
  }, [adminUser])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const hasMiMesaTab = !adminUser.is_super && isLiderOrColider && !isAdditionalTeam
  const hasReportesTab = adminUser.is_super || isCartasTeam || isSnacksTeam || isLogisticaTeam || isMesaRegistroTeam
  const tabCount = adminUser.is_super ? 6 : hasMiMesaTab || hasReportesTab ? 5 : 4
  const isReadOnlyByAdditionalTeam = !adminUser.is_super && isAdditionalTeam

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-2 sm:items-center">
            <div className="flex min-w-0 items-center gap-3 sm:flex-1">
              <Image src={logoSrc} alt="El Camino de Emaús" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight md:text-xl">Panel administrativo</h1>
                <div className="mt-1 flex min-w-0 flex-col gap-0.5 text-xs text-muted-foreground md:flex-row md:items-center md:gap-2 md:text-sm">
                  <span className="truncate font-medium text-foreground">{adminUser.nombre_completo}</span>
                  {alojamientoServidor ? (
                    <span className="flex min-w-0 items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {alojamientoServidor.edificio_nombre} - {alojamientoServidor.habitacion_nombre}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center md:gap-2">
              {pagoServidor ? (
                <Badge variant="secondary" className={`${getPaymentBadgeClass(pagoServidor.status)} order-2 shrink-0 sm:order-1`}>
                  {pagoServidor.text}
                </Badge>
              ) : null}
              <div className="order-1 flex max-w-48 flex-wrap items-center justify-end gap-1.5 sm:order-2 sm:max-w-none md:gap-2">
                {adminUser.is_super && <SystemSettingsPanel />}
                {(adminUser.is_super || isContabilidadTeam) && (
                  <Link href="/admin/camisas">
                    <Button variant="outline" size="icon" aria-label="Abrir panel de camisas" title="Panel de camisas">
                      <Shirt className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {(adminUser.is_super || canManageSantisimo) && (
                  <Link href="/admin/turnos-santisimo">
                    <Button variant="outline" size="icon" aria-label="Abrir Turnos en el Santísimo" title="Turnos en el Santísimo">
                      <CalendarClock className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {(adminUser.is_super || isLogisticaTeam) && (
                  <Link href="/admin/alojamiento">
                    <Button variant="outline" size="icon" aria-label="Abrir módulo de alojamiento" title="Alojamiento">
                      <Building2 className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {(adminUser.is_super || isLogisticaTeam) && (
                  <Link href="/admin/asistencia">
                    <Button variant="outline" size="icon" aria-label="Abrir control de asistencia" title="Control de asistencia">
                      <ClipboardCheck className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/minuto-a-minuto">
                  <Button variant="outline" size="icon" aria-label="Abrir Minuto a Minuto" title="Minuto a Minuto">
                    <Timer className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut} size="sm" className="shrink-0">
                  <LogOut className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {turnosSantisimo.length > 0 ? (
          <Card className="mb-4 gap-0 border-amber-200 bg-amber-50/60 py-0">
            <details className="group md:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-5 w-5 shrink-0 text-amber-700" />
                  <span className="truncate">Mis turnos en el Santísimo</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="border-amber-300 bg-background text-amber-900">
                    {turnosSantisimo.length}
                  </Badge>
                  <ChevronDown className="h-4 w-4 text-amber-800 transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div className="flex flex-col gap-1.5 border-t border-amber-200 px-3 py-2.5">
                {turnosSantisimo.map((turno) => (
                  <div key={turno.id} className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-background px-2.5 py-1.5 text-xs font-medium text-amber-950">
                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <span>{formatSantisimoTurn(turno.turno_inicio)}</span>
                  </div>
                ))}
              </div>
            </details>

            <CardContent className="hidden items-center gap-4 px-4 py-2 md:flex">
              <div className="flex shrink-0 items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold md:text-base">
                  <CalendarClock className="h-5 w-5 shrink-0 text-amber-700" />
                  Mis turnos en el Santísimo
                </div>
                <Badge variant="outline" className="shrink-0 border-amber-300 bg-background text-amber-900">
                  {turnosSantisimo.length}
                </Badge>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 md:justify-end">
                {turnosSantisimo.map((turno) => (
                  <div key={turno.id} className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-background px-2.5 py-1.5 text-xs font-medium text-amber-950 md:text-sm">
                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <span>{formatSantisimoTurn(turno.turno_inicio)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            {activeTab === "equipos" ? <EquiposManagement adminUser={adminUser} /> : null}
          </TabsContent>

          <TabsContent value="mesas">
            {activeTab === "mesas" ? <MesasManagement adminUser={adminUser} readOnly={isReadOnlyByAdditionalTeam} /> : null}
          </TabsContent>

          <TabsContent value="caminantes">
            {activeTab === "caminantes" ? (
              <CaminantesManagement
                adminUser={adminUser}
                readOnly={isReadOnlyByAdditionalTeam}
                canManagePayments={adminUser.is_super || isContabilidadTeam}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="servidores">
            {activeTab === "servidores" ? (
              <ServidoresManagement
                adminUser={adminUser}
                readOnly={isReadOnlyByAdditionalTeam}
                canManagePayments={adminUser.is_super || isContabilidadTeam}
              />
            ) : null}
          </TabsContent>

          {adminUser.is_super && (
            <TabsContent value="admins">
              {activeTab === "admins" ? <AdminsManagement /> : null}
            </TabsContent>
          )}

          {hasMiMesaTab && (
            <TabsContent value="mi-mesa">
              {activeTab === "mi-mesa" ? <MesaReport adminUser={adminUser} /> : null}
            </TabsContent>
          )}

          {hasReportesTab && (
            <TabsContent value="reportes">
              {activeTab === "reportes" && (adminUser.is_super || isLogisticaTeam) ? (
                <ReportsManagement isSuperAdmin={adminUser.is_super} isLogisticaTeam={isLogisticaTeam} />
              ) : activeTab === "reportes" && isMesaRegistroTeam ? (
                <ReportsManagement onlyVerificacionExistencia isSuperAdmin={adminUser.is_super} isLogisticaTeam={isLogisticaTeam} />
              ) : activeTab === "reportes" && isCartasTeam ? (
                <ReportsManagement onlyCartas isSuperAdmin={adminUser.is_super} isLogisticaTeam={isLogisticaTeam} />
              ) : activeTab === "reportes" ? (
                <ReportsManagement onlyRestricciones isSuperAdmin={adminUser.is_super} isLogisticaTeam={isLogisticaTeam} />
              ) : null}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
