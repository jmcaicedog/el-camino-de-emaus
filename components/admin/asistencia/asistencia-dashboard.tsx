"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, ClipboardCheck, Clock3, ListChecks, Loader2, Table2, UserRound, Users } from "lucide-react"
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
  const totalPersonas = total + totalServidores
  const totalLlegaron = llegaron + llegaronServidores
  const totalPendientes = pendientes + pendientesServidores
  const porcentajeTotal = totalPersonas > 0 ? Math.round((totalLlegaron / totalPersonas) * 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Control de asistencia
            </CardTitle>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold leading-none">{totalLlegaron}</p>
                <p className="mt-1 text-xs font-medium">asistentes confirmados</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total convocados
              </div>
              <p className="mt-2 text-2xl font-bold">{totalPersonas}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Ya llegaron
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{totalLlegaron}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Clock3 className="h-4 w-4" />
                Pendientes
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700">{totalPendientes}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Asistencia general</span>
                <span className="font-bold text-emerald-700">{porcentajeTotal}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${porcentajeTotal}%` }} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sky-900">Caminantes</h3>
                  <span className="text-sm font-bold text-sky-700">{porcentaje}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
                  <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${porcentaje}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sky-800">
                  <span><strong>{total}</strong> total</span>
                  <span><strong>{llegaron}</strong> llegaron</span>
                  <span><strong>{pendientes}</strong> pendientes</span>
                </div>
              </div>

              <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-violet-900">Servidores</h3>
                  <span className="text-sm font-bold text-violet-700">{porcentajeServidores}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${porcentajeServidores}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-violet-800">
                  <span><strong>{totalServidores}</strong> total</span>
                  <span><strong>{llegaronServidores}</strong> llegaron</span>
                  <span><strong>{pendientesServidores}</strong> pendientes</span>
                </div>
              </div>
            </div>
          </div>
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
