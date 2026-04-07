"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Download } from "lucide-react"
import { CaminanteGridView } from "@/components/servidor/caminante-grid-view"
import type { AdminUser, Caminante, Servidor } from "@/lib/types"

interface MesaReportProps {
  adminUser: AdminUser
}

export function MesaReport({ adminUser }: MesaReportProps) {
  const { toast } = useToast()
  const [caminantes, setCaminantes] = useState<Caminante[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [mesaNumero, setMesaNumero] = useState<number | null>(null)
  const [mesaId, setMesaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [caminantesRes, servidoresRes] = await Promise.all([
        fetch("/api/caminantes"),
        fetch("/api/servidores"),
      ])
      const [caminantesData, servidoresData] = await Promise.all([
        caminantesRes.json(),
        servidoresRes.json(),
      ])

      // Encontrar la mesa del administrador actual
      const adminServidor = servidoresData.find(
        (s: Servidor) => s.auth_user_id === adminUser.id && 
        (s.tipo_servidor === 'lider' || s.tipo_servidor === 'colider')
      )

      if (adminServidor?.mesa_id) {
        // Obtener número de mesa y guardar id
        const mesaRes = await fetch(`/api/mesas`)
        const mesasData = await mesaRes.json()
        const mesa = mesasData.find((m: any) => m.id === adminServidor.mesa_id)
        setMesaNumero(mesa?.numero || null)
        setMesaId(mesa?.id || null)

        // Filtrar caminantes de la mesa
        const caminantesDeMesa = caminantesData.filter(
          (c: Caminante) => c.mesa_id === adminServidor.mesa_id
        )
        setCaminantes(caminantesDeMesa)
        setServidores(servidoresData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar datos del reporte",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadReport = () => {
    if (!mesaId) return;
    // Abrir ventana sincronamente para evitar bloqueadores
    let win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(
      `<!doctype html><html><head><meta charset=\"utf-8\"><title>Generando reporte...</title></head><body><p>Generando reporte, por favor espere...</p></body></html>`
    );
    win.document.close();
    fetch(`/api/reports/caminantes?format=pdf&mesa=${encodeURIComponent(mesaId)}&paper=legal&orientation=portrait`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Error al generar reporte");
        const html = await response.text();
        win.document.open();
        win.document.write(html);
        win.document.close();
        try {
          win.focus();
          win.print();
        } catch (e) {}
      })
      .catch(() => {
        try { if (win && !win.closed) win.close(); } catch (e) {}
        toast({ title: "Error", description: "Error al generar el reporte", variant: "destructive" });
      });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (caminantes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Caminantes - Mesa {mesaNumero || "Sin asignar"}</CardTitle>
          <CardDescription>No hay caminantes asignados a tu mesa</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reporte de Caminantes - Mesa {mesaNumero}</CardTitle>
              <CardDescription>Total: {caminantes.length} caminantes</CardDescription>
            </div>
            <Button onClick={downloadReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar reporte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CaminanteGridView caminantes={caminantes} onUpdate={loadData} canEdit={true} />
        </CardContent>
      </Card>
    </div>
  )
}
