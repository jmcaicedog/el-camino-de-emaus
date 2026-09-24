"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, FileDown, Loader2, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getSantisimoSlots, type SantisimoSlot } from "@/lib/santisimo-turnos"
import type { TurnoSantisimo } from "@/lib/types"
import { exportTurnosSantisimoPdf } from "./turnos-santisimo-pdf"

interface ServidorOption {
  id: string
  nombre_completo: string
  imagen?: string | null
}

interface TurnosResponse {
  retiro_datetime: string
  servidores: ServidorOption[]
  turnos: TurnoSantisimo[]
}

export function TurnosSantisimoManagement() {
  const { toast } = useToast()
  const [data, setData] = useState<TurnosResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SantisimoSlot | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingRemoval, setPendingRemoval] = useState<TurnoSantisimo | null>(null)

  const loadTurnos = async () => {
    try {
      const response = await fetch("/api/turnos-santisimo", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || "No fue posible cargar los turnos")
      setData(payload)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible cargar los turnos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTurnos()
  }, [])

  const slots = useMemo(() => data ? getSantisimoSlots(data.retiro_datetime) : [], [data])
  const turnosBySlot = useMemo(() => {
    const grouped = new Map<string, TurnoSantisimo[]>()
    for (const turno of data?.turnos || []) {
      const key = new Date(turno.turno_inicio).toISOString()
      grouped.set(key, [...(grouped.get(key) || []), turno])
    }
    return grouped
  }, [data])

  const existingServerIds = new Set(
    selectedSlot ? (turnosBySlot.get(new Date(selectedSlot.inicio).toISOString()) || []).map((turno) => turno.servidor_id) : [],
  )
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es")
  const filteredServers = (data?.servidores || []).filter((servidor) =>
    !existingServerIds.has(servidor.id) && servidor.nombre_completo.toLocaleLowerCase("es").includes(normalizedSearch),
  )

  const openAssignment = (slot: SantisimoSlot) => {
    setSelectedSlot(slot)
    setSelectedIds(new Set())
    setSearchTerm("")
  }

  const toggleServer = (serverId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(serverId)
      else next.delete(serverId)
      return next
    })
  }

  const assignServers = async () => {
    if (!selectedSlot || selectedIds.size === 0) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/turnos-santisimo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turno_inicio: selectedSlot.inicio, servidor_ids: Array.from(selectedIds) }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.message || "No fue posible asignar el turno")
      setSelectedSlot(null)
      await loadTurnos()
      toast({ title: "Turno asignado", description: `${selectedIds.size} servidor${selectedIds.size === 1 ? "" : "es"} agregado${selectedIds.size === 1 ? "" : "s"}.` })
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No fue posible asignar el turno", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const removeServer = async () => {
    if (!pendingRemoval) return
    const response = await fetch(`/api/turnos-santisimo?id=${encodeURIComponent(pendingRemoval.id)}`, { method: "DELETE" })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast({ title: "Error", description: payload?.message || "No fue posible remover al servidor", variant: "destructive" })
      return
    }
    await loadTurnos()
    toast({ title: "Servidor removido", description: "La asignación fue eliminada." })
    setPendingRemoval(null)
  }

  if (isLoading) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><CalendarClock className="h-6 w-6" />Turnos en el Santísimo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Asigna uno o más servidores a cada franja de una hora.</p>
        </div>
        <Button variant="outline" onClick={() => exportTurnosSantisimoPdf(data.turnos)} disabled={data.turnos.length === 0}>
          <FileDown className="mr-2 h-4 w-4" />Exportar PDF
        </Button>
      </div>

      <Tabs defaultValue="viernes" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3">
          {(["viernes", "sabado", "domingo"] as const).map((dayKey) => {
            const daySlots = slots.filter((slot) => slot.dayKey === dayKey)
            return (
              <TabsTrigger key={dayKey} value={dayKey} className="py-2.5">
                {daySlots[0]?.dayLabel}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {(["viernes", "sabado", "domingo"] as const).map((dayKey) => {
          const daySlots = slots.filter((slot) => slot.dayKey === dayKey)
          return (
            <TabsContent key={dayKey} value={dayKey}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{daySlots[0]?.dayLabel}</CardTitle>
                  <CardDescription>{daySlots.length} franjas horarias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3 sm:px-5 sm:pb-5">
                  {daySlots.map((slot) => {
                    const assignments = turnosBySlot.get(new Date(slot.inicio).toISOString()) || []
                    const isAssigned = assignments.length > 0
                    return (
                      <div
                        key={slot.inicio}
                        className={`grid gap-3 rounded-md border-l-4 px-4 py-3 transition-colors sm:grid-cols-[190px_minmax(0,1fr)_auto] sm:items-center ${
                          isAssigned
                            ? "border-green-600 bg-green-50/80"
                            : "border-red-500 bg-red-50/80"
                        }`}
                      >
                        <div className={`whitespace-nowrap font-semibold tabular-nums ${isAssigned ? "text-green-900" : "text-red-900"}`}>
                          {slot.timeLabel}
                        </div>
                        <div className="flex min-w-0 flex-wrap gap-2">
                          {assignments.length === 0 ? (
                            <span className="text-sm font-medium text-red-700">Sin servidores asignados</span>
                          ) : assignments.map((turno) => (
                            <span key={turno.id} className="inline-flex max-w-full items-center gap-1 rounded-md border border-green-300 bg-green-100 px-2 py-1 text-sm font-medium text-green-900">
                              <span className="truncate">{turno.servidor?.nombre_completo || "Servidor"}</span>
                              <button type="button" className="rounded p-0.5 hover:bg-green-200" aria-label={`Remover a ${turno.servidor?.nombre_completo || "servidor"}`} title="Remover del turno" onClick={() => setPendingRemoval(turno)}>
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className={isAssigned ? "border-green-300 bg-white/80" : "border-red-300 bg-white/80"} onClick={() => openAssignment(slot)}>
                          <Plus className="mr-2 h-4 w-4" />Asignar
                        </Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog open={Boolean(selectedSlot)} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
          <DialogHeader><DialogTitle>Asignar servidores</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{selectedSlot?.dayLabel}, {selectedSlot?.timeLabel}</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nombre" className="pl-9" />
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
            {filteredServers.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No hay servidores disponibles.</p> : filteredServers.map((servidor) => (
              <label key={servidor.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted">
                <Checkbox checked={selectedIds.has(servidor.id)} onCheckedChange={(checked) => toggleServer(servidor.id, checked === true)} />
                <span className="text-sm">{servidor.nombre_completo}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setSelectedSlot(null)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={assignServers} disabled={isSaving || selectedIds.size === 0}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Asignar ({selectedIds.size})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title="Remover del turno"
        description={`¿Deseas remover a ${pendingRemoval?.servidor?.nombre_completo || "este servidor"} de esta franja horaria?`}
        confirmLabel="Remover"
        onConfirm={removeServer}
      />
    </div>
  )
}
