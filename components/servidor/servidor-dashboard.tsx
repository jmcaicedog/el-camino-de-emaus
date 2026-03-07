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
  allMesas?: Mesa[]
}

export function ServidorDashboard({ servidor, mesa, caminantes: initialCaminantes, isCartasTeam = false, allMesas = [] }: ServidorDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [caminantes, setCaminantes] = useState(initialCaminantes)

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="El Camino de Emaús" width={50} height={50} className="object-contain" />
              <div>
                <h1 className="text-2xl font-bold">Panel de Servidor</h1>
                <p className="text-sm text-muted-foreground">
                  {servidor.nombre_completo} -{" "}
                  {isCartasTeam ? (
                    <Badge variant="secondary">Equipo de Cartas</Badge>
                  ) : (
                    <Badge variant="secondary">{servidor.tipo_servidor === "lider" ? "Líder" : "Colíder"}</Badge>
                  )}
                </p>
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
        {isCartasTeam ? (
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
                    <CartasReportOnly />
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

// Component that shows only the "Cartas" report from ReportsManagement
function CartasReportOnly() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const exportReport = async (format: "excel" | "pdf") => {
    setIsExporting(`cartas-${format}`)
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

      const response = await fetch(`/api/reports/cartas?format=${format}`)
      if (!response.ok) throw new Error("Error al generar reporte")

      if (format === "excel") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `cartas-${new Date().toISOString().split("T")[0]}.xlsx`
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
        disabled={isExporting === "cartas-excel"}
      >
        {isExporting === "cartas-excel" ? (
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
        disabled={isExporting === "cartas-pdf"}
      >
        {isExporting === "cartas-pdf" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        PDF
      </Button>
    </div>
  )
}
