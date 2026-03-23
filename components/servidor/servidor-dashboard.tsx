"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Users, Mail, Loader2, FileSpreadsheet, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Servidor, Mesa, Caminante } from "@/lib/types"
import { CaminanteGridView } from "@/components/servidor/caminante-grid-view"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface ServidorDashboardProps {
  servidor: Servidor
  mesa: Mesa | null
  caminantes: Caminante[]
  isCartasTeam?: boolean
  isSnacksTeam?: boolean
  isLogisticaTeam?: boolean
  allMesas?: Mesa[]
}

export function ServidorDashboard({ servidor, mesa, caminantes: initialCaminantes, isCartasTeam = false, isSnacksTeam = false, isLogisticaTeam = false, allMesas = [] }: ServidorDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [caminantes, setCaminantes] = useState(initialCaminantes)

  const parseMoney = (value: unknown) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0
    if (typeof value === "string") {
      const digitsOnly = value.replace(/[^\d-]/g, "")
      const parsed = Number.parseInt(digitsOnly, 10)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const montoPagado = parseMoney(servidor.monto_pagado)
  const montoTotal = parseMoney(servidor.monto_total)
  const pagoServidor = `$${montoPagado.toLocaleString("es-CO")} / $${montoTotal.toLocaleString("es-CO")}`
  const paymentStatus = montoPagado <= 0 ? "zero" : montoPagado >= montoTotal ? "complete" : "partial"

  const getPaymentBadgeClass = () => {
    if (paymentStatus === "zero") return "bg-red-100 text-red-800 border-red-300"
    if (paymentStatus === "complete") return "bg-emerald-100 text-emerald-800 border-emerald-300"
    return "bg-amber-100 text-amber-800 border-amber-300"
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const refreshCaminantes = async () => {
    if (isCartasTeam) {
      const response = await fetch("/api/caminantes")
      const data = await response.json()
      setCaminantes(data)
      return
    }

    if (!mesa) return
    const response = await fetch(`/api/mesas/${mesa.id}/caminantes`)
    const data = await response.json()
    setCaminantes(data)
  }

  // Group caminantes by mesa for Cartas team view
  const caminantesByMesa = isCartasTeam
    ? allMesas.map((m) => ({
        mesa: m,
        caminantes: caminantes.filter((c) => c.mesa_id === m.id),
      }))
    : []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Image src="/logo.png" alt="El Camino de Emaús" width={40} height={40} className="object-contain flex-shrink-0 md:w-[50px] md:h-[50px]" />
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold">Panel de Servidor</h1>
                <div className="mt-0.5 flex flex-col items-start gap-1 text-xs md:text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
                  <span className="max-w-[170px] truncate sm:max-w-none">{servidor.nombre_completo}</span>
                  <Badge variant="secondary" className={getPaymentBadgeClass()}>
                    {pagoServidor}
                  </Badge>
                  {isCartasTeam ? (
                    <Badge variant="secondary">Equipo de Cartas</Badge>
                  ) : isSnacksTeam ? (
                    <Badge variant="secondary">Equipo de Snacks</Badge>
                  ) : isLogisticaTeam ? (
                    <Badge variant="secondary">Equipo de Logística</Badge>
                  ) : (
                    <Badge variant="secondary">{servidor.tipo_servidor === "lider" ? "Líder" : "Colíder"}</Badge>
                  )}
                </div>
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
        {isLogisticaTeam && !isCartasTeam && !isSnacksTeam ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Reportes</h2>
              <p className="text-muted-foreground">Genera y descarga reportes</p>
            </div>
            <LogisticaReports />
          </div>
        ) : isSnacksTeam && !isCartasTeam ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Reportes</h2>
              <p className="text-muted-foreground">Genera y descarga el reporte de restricciones alimenticias</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Restricciones Alimenticias y Medicamentos
                </CardTitle>
                <CardDescription>Información médica y restricciones de caminantes y servidores</CardDescription>
              </CardHeader>
              <CardContent>
                <SingleReportExport reportType="restricciones" />
              </CardContent>
            </Card>
          </div>
        ) : isCartasTeam ? (
          <Tabs defaultValue="cartas" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cartas" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Cartas y Fotos</span>
              </TabsTrigger>
              <TabsTrigger value="reportes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Reportes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cartas">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Cartas y Fotos de Caminantes
                    </CardTitle>
                    <CardDescription>
                      {caminantes.length} caminante{caminantes.length !== 1 ? "s" : ""} en total
                    </CardDescription>
                  </CardHeader>
                </Card>

                {caminantesByMesa.map(({ mesa: m, caminantes: mesaCaminantes }) => (
                  <Card key={m.id}>
                    <CardHeader>
                      <CardTitle className="text-base">Mesa {m.numero}</CardTitle>
                      <CardDescription>
                        {mesaCaminantes.length} caminante{mesaCaminantes.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    {mesaCaminantes.length > 0 && (
                      <CardContent>
                        <CaminanteGridView caminantes={mesaCaminantes} onUpdate={refreshCaminantes} canEdit={true} />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reportes">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Reportes</h2>
                  <p className="text-muted-foreground">Genera y descarga el reporte de cartas y fotos</p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Cartas de Caminantes por Mesa
                    </CardTitle>
                    <CardDescription>Número de cartas y fotos recibidas por cada caminante, organizado por mesa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SingleReportExport reportType="cartas" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : !mesa ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin Mesa Asignada</CardTitle>
              <CardDescription>Aún no has sido asignado a una mesa. Contacta al administrador.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mesa {mesa.numero}
                </CardTitle>
                <CardDescription>
                  {caminantes.length} caminante{caminantes.length !== 1 ? "s" : ""} asignado
                  {caminantes.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
            </Card>

            {caminantes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay caminantes asignados a esta mesa aún.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <CaminanteGridView caminantes={caminantes} onUpdate={refreshCaminantes} canEdit={true} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Reusable component for exporting a single report type
function SingleReportExport({ reportType }: { reportType: string }) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const exportReport = async (format: "excel" | "pdf") => {
    setIsExporting(`${reportType}-${format}`)
    let win: Window | null = null
    try {
      if (format === "pdf") {
        win = window.open("", "_blank")
        if (!win) throw new Error("No se pudo abrir una nueva ventana para el reporte")
        win.document.open()
        win.document.write(
          `<!doctype html><html><head><meta charset="utf-8"><title>Cargando reporte...</title></head><body><p>Cargando reporte, por favor espere...</p></body></html>`
        )
        win.document.close()
      }

      const response = await fetch(`/api/reports/${encodeURIComponent(reportType)}?format=${format}`)
      if (!response.ok) throw new Error("Error al generar reporte")

      if (format === "excel") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportType}-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const html = await response.text()
        if (win) {
          win.document.open()
          win.document.write(html)
          win.document.close()
          try { win.focus(); win.print() } catch (e) { /* no-op */ }
        }
      }

      toast({ title: "Reporte generado", description: "El reporte se ha descargado correctamente" })
    } catch (error) {
      try { if (win && !win.closed) win.close() } catch (e) { /* ignore */ }
      toast({ title: "Error", description: "Error al generar el reporte", variant: "destructive" })
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="flex-1 bg-transparent"
        onClick={() => exportReport("excel")}
        disabled={isExporting === `${reportType}-excel`}
      >
        {isExporting === `${reportType}-excel` ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Excel
      </Button>
      <Button
        variant="outline"
        className="flex-1 bg-transparent"
        onClick={() => exportReport("pdf")}
        disabled={isExporting === `${reportType}-pdf`}
      >
        {isExporting === `${reportType}-pdf` ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        PDF
      </Button>
    </div>
  )
}

// All reports view for Logística team
function LogisticaReports() {
  const reports = [
    { id: "caminantes", title: "Reporte de Caminantes", description: "Lista completa de caminantes con toda su información" },
    { id: "servidores", title: "Reporte de Servidores", description: "Lista completa de servidores con toda su información" },
    { id: "mesas", title: "Reporte de Mesas", description: "Organización de mesas con caminantes y servidores asignados" },
    { id: "pagos", title: "Reporte de Pagos", description: "Estado de pagos de caminantes y servidores" },
    { id: "cartas", title: "Cartas de Caminantes por Mesa", description: "Número de cartas y fotos recibidas por cada caminante, organizado por mesa" },
    { id: "restricciones", title: "Restricciones Alimenticias y Medicamentos", description: "Información médica y restricciones de caminantes y servidores" },
    { id: "equipos-servidores", title: "Equipos y Servidores", description: "Listado de equipos con sus servidores asignados" },
    { id: "tallas", title: "Tallas de Camiseta (Caminantes)", description: "Listado de caminantes con sus tallas de camiseta" },
    { id: "tallas-servidores", title: "Tallas y Colores (Servidores)", description: "Servidores que marcaron colores en el formulario y sus tallas/colores" },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {report.title}
            </CardTitle>
            <CardDescription>{report.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <SingleReportExport reportType={report.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
