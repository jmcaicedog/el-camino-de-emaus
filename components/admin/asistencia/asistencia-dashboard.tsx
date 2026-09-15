"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ClipboardCheck, ListChecks, Loader2, Table2, UserRound } from "lucide-react"
import { AsistenciaLista } from "./asistencia-lista"
import { AsistenciaMesas } from "./asistencia-mesas"
import { AsistenciaServidores } from "./asistencia-servidores"
import type { CaminanteAsistenciaResumen, Mesa, ServidorAsistenciaResumen } from "@/lib/types"

type MesaResponsables = Record<string, { lider: string | null; colider: string | null }>

export function AsistenciaDashboard() {
  const { toast } = useToast()
  const [caminantes, setCaminantes] = useState<CaminanteAsistenciaResumen[]>([])
  const [servidores, setServidores] = useState<ServidorAsistenciaResumen[]>([])
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [mesaResponsables, setMesaResponsables] = useState<MesaResponsables>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/asistencia", { cache: "no-store" })
      if (!res.ok) throw new Error("Error al cargar datos")
      const data = await res.json()
      setCaminantes(data.caminantes ?? [])
      setServidores(data.servidores ?? [])
      setMesas(data.mesas ?? [])
      setMesaResponsables(data.mesa_responsables ?? {})
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los datos de asistencia", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleAsistencia = async (caminanteId: string, llego: boolean) => {
    // Optimistic update
    setCaminantes((prev) =>
      prev.map((c) =>
        c.id === caminanteId
          ? { ...c, llego, llegada_at: llego ? new Date().toISOString() : null }
          : c
      )
    )

    try {
      const res = await fetch(`/api/asistencia/${caminanteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llego }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
    } catch {
      // Revert on error
      setCaminantes((prev) =>
        prev.map((c) =>
          c.id === caminanteId ? { ...c, llego: !llego, llegada_at: null } : c
        )
      )
      toast({ title: "Error", description: "No se pudo actualizar la asistencia", variant: "destructive" })
    }
  }

  const toggleAsistenciaServidor = async (servidorId: string, llego: boolean) => {
    setServidores((prev) =>
      prev.map((s) =>
        s.id === servidorId
          ? { ...s, llego, llegada_at: llego ? new Date().toISOString() : null }
          : s
      )
    )

    try {
      const res = await fetch(`/api/asistencia/servidores/${servidorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llego }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
    } catch {
      setServidores((prev) =>
        prev.map((s) =>
          s.id === servidorId ? { ...s, llego: !llego, llegada_at: null } : s
        )
      )
      toast({ title: "Error", description: "No se pudo actualizar la asistencia del servidor", variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const total = caminantes.length
  const llegaron = caminantes.filter((c) => c.llego).length
  const pendientes = total - llegaron
  const porcentaje = total > 0 ? Math.round((llegaron / total) * 100) : 0
  const totalServidores = servidores.length
  const llegaronServidores = servidores.filter((s) => s.llego).length
  const pendientesServidores = totalServidores - llegaronServidores
  const porcentajeServidores = totalServidores > 0 ? Math.round((llegaronServidores / totalServidores) * 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Control de asistencia
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Total caminantes: {total}</span>
          <span>Llegaron: {llegaron}</span>
          <span>Pendientes: {pendientes}</span>
          <span>Porcentaje de asistencia: {porcentaje}%</span>
          <span>Total servidores: {totalServidores}</span>
          <span>Llegaron servidores: {llegaronServidores}</span>
          <span>Pendientes servidores: {pendientesServidores}</span>
          <span>Porcentaje servidores: {porcentajeServidores}%</span>
        </CardContent>
      </Card>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="mesas" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Mesa
          </TabsTrigger>
          <TabsTrigger value="servidores" className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Servidores
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="mt-4">
          <AsistenciaLista caminantes={caminantes} onToggle={toggleAsistencia} />
        </TabsContent>
        <TabsContent value="mesas" className="mt-4">
          <AsistenciaMesas
            caminantes={caminantes}
            mesas={mesas}
            mesaResponsables={mesaResponsables}
            onToggle={toggleAsistencia}
          />
        </TabsContent>
        <TabsContent value="servidores" className="mt-4">
          <AsistenciaServidores servidores={servidores} onToggle={toggleAsistenciaServidor} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
