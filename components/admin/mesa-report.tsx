"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Download } from "lucide-react"
import type { AdminUser, Caminante, Servidor } from "@/lib/types"

interface MesaReportProps {
  adminUser: AdminUser
}

export function MesaReport({ adminUser }: MesaReportProps) {
  const { toast } = useToast()
  const [caminantes, setCaminantes] = useState<Caminante[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [mesaNumero, setMesaNumero] = useState<number | null>(null)
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
        // Obtener número de mesa
        const mesaRes = await fetch(`/api/mesas`)
        const mesasData = await mesaRes.json()
        const mesa = mesasData.find((m: any) => m.id === adminServidor.mesa_id)
        setMesaNumero(mesa?.numero || null)

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

  const downloadCSV = () => {
    const headers = [
      "Nombre",
      "Documento",
      "Edad",
      "Correo",
      "Teléfono",
      "Restricciones alimenticias",
      "Medicamentos",
      "Condiciones especiales",
      "Cartas",
      "Fotos"
    ]

    const rows = caminantes.map(c => [
      c.nombre_completo,
      c.cedula,
      c.edad.toString(),
      c.correo,
      c.celular,
      c.restricciones_alimenticias || "-",
      c.medicamentos || "-",
      c.ronca_al_dormir ? "Ronca al dormir" : "-",
      (c.cartas_recibidas || 0).toString(),
      (c.fotos_recibidas || 0).toString()
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `caminantes_mesa_${mesaNumero || 'sin_numero'}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <Button onClick={downloadCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Restricciones</TableHead>
                  <TableHead>Medicamentos</TableHead>
                  <TableHead>Condiciones</TableHead>
                  <TableHead className="text-center">Cartas</TableHead>
                  <TableHead className="text-center">Fotos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caminantes.map((caminante) => (
                  <TableRow key={caminante.id}>
                    <TableCell className="font-medium">{caminante.nombre_completo}</TableCell>
                    <TableCell>{caminante.cedula}</TableCell>
                    <TableCell>{caminante.edad}</TableCell>
                    <TableCell className="max-w-xs truncate" title={caminante.correo}>
                      {caminante.correo}
                    </TableCell>
                    <TableCell>{caminante.celular}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={caminante.restricciones_alimenticias || "-"}>
                        {caminante.restricciones_alimenticias || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={caminante.medicamentos || "-"}>
                        {caminante.medicamentos || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{caminante.ronca_al_dormir ? "Ronca al dormir" : "-"}</TableCell>
                    <TableCell className="text-center">{caminante.cartas_recibidas || 0}</TableCell>
                    <TableCell className="text-center">{caminante.fotos_recibidas || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
