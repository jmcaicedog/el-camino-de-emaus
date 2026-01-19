"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"

export function ReportsManagement() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const exportReport = async (type: "caminantes" | "servidores" | "mesas" | "pagos" | "cartas" | "restricciones", format: "excel" | "pdf") => {
    setIsExporting(`${type}-${format}`)
    let win: Window | null = null
    try {
      // If user wants PDF, open the window synchronously to avoid popup blockers.
      if (format === "pdf") {
        win = window.open("", "_blank")
        if (!win) throw new Error("No se pudo abrir una nueva ventana para el reporte")
        // Show a simple loading page so the user sees feedback while we fetch the report
        win.document.open()
        win.document.write(
          `<!doctype html><html><head><meta charset="utf-8"><title>Cargando reporte...</title></head><body><p>Cargando reporte, por favor espere...</p></body></html>`
        )
        win.document.close()
      }

      const response = await fetch(`/api/reports/${type}?format=${format}`)

      if (!response.ok) throw new Error("Error al generar reporte")

      if (format === "excel") {
        // Server returns an .xlsx file when exceljs is available
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Server returns HTML for printable report. We already opened a window synchronously above.
        const html = await response.text()
        if (win) {
          win.document.open()
          win.document.write(html)
          win.document.close()
          // Try to trigger print — may be blocked by browser, but opening synchronously avoids most blockers
          try {
            win.focus()
            win.print()
          } catch (e) {
            // no-op
          }
        } else {
          // Fallback: if for some reason window isn't available, open a new one now (may be blocked)
          const fallback = window.open("", "_blank")
          if (fallback) {
            fallback.document.open()
            fallback.document.write(html)
            fallback.document.close()
            try {
              fallback.focus()
              fallback.print()
            } catch (e) {
              // no-op
            }
          }
        }
      }

      toast({
        title: "Reporte generado",
        description: `El reporte se ha descargado correctamente`,
      })
    } catch (error) {
      // Close the opened window if there was an error after opening it
      try {
        if (win && !win.closed) win.close()
      } catch (e) {
        // ignore
      }

      toast({
        title: "Error",
        description: "Error al generar el reporte",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
    }
  }

  const reports = [
    {
      id: "caminantes",
      title: "Reporte de Caminantes",
      description: "Lista completa de caminantes con toda su información",
      icon: FileSpreadsheet,
    },
    {
      id: "servidores",
      title: "Reporte de Servidores",
      description: "Lista completa de servidores con toda su información",
      icon: FileSpreadsheet,
    },
    {
      id: "mesas",
      title: "Reporte de Mesas",
      description: "Organización de mesas con caminantes y servidores asignados",
      icon: FileSpreadsheet,
    },
    {
      id: "pagos",
      title: "Reporte de Pagos",
      description: "Estado de pagos de caminantes y servidores",
      icon: FileSpreadsheet,
    },
    {
      id: "cartas",
      title: "Cartas de Caminantes por Mesa",
      description: "Número de cartas y fotos recibidas por cada caminante, organizado por mesa",
      icon: FileText,
    },
    {
      id: "restricciones",
      title: "Restricciones Alimenticias y Medicamentos",
      description: "Información médica y restricciones de caminantes y servidores",
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Reportes y Exportación</h2>
        <p className="text-muted-foreground">Genera y descarga reportes en formato Excel o PDF</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => exportReport(report.id as any, "excel")}
                  disabled={isExporting === `${report.id}-excel`}
                >
                  {isExporting === `${report.id}-excel` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Excel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => exportReport(report.id as any, "pdf")}
                  disabled={isExporting === `${report.id}-pdf`}
                >
                  {isExporting === `${report.id}-pdf` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
