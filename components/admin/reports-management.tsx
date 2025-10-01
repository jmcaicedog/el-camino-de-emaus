"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"

export function ReportsManagement() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const exportReport = async (type: "caminantes" | "servidores" | "mesas" | "pagos", format: "excel" | "pdf") => {
    setIsExporting(`${type}-${format}`)
    try {
      const response = await fetch(`/api/reports/${type}?format=${format}`)

      if (!response.ok) throw new Error("Error al generar reporte")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type}-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "pdf"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Reporte generado",
        description: `El reporte se ha descargado correctamente`,
      })
    } catch (error) {
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
