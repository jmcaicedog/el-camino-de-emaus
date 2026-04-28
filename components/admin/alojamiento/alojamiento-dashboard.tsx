"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BedDouble, Building2, LayoutGrid } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EdificiosConfig } from "@/components/admin/alojamiento/edificios-config"
import { AsignacionVisual } from "@/components/admin/alojamiento/asignacion-visual"
import type { EdificioConHabitaciones, PersonaAlojamientoResumen } from "@/lib/types"

interface AlojamientoPayload {
  edificios: EdificioConHabitaciones[]
  personas_disponibles: PersonaAlojamientoResumen[]
}

export function AlojamientoDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [edificios, setEdificios] = useState<EdificioConHabitaciones[]>([])
  const [personasDisponibles, setPersonasDisponibles] = useState<PersonaAlojamientoResumen[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/alojamiento/edificios", { cache: "no-store" })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || "No fue posible cargar datos de alojamiento")
      }

      const payload = result as AlojamientoPayload
      setEdificios(payload.edificios || [])
      setPersonasDisponibles(payload.personas_disponibles || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible cargar alojamiento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const runMutation = useCallback(
    async (action: () => Promise<Response>, successMessage: string) => {
      setBusy(true)
      try {
        const response = await action()
        const result = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(result.message || "Error procesando solicitud")
        }

        toast({ title: "Listo", description: successMessage })
        await loadData()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No fue posible completar la operación",
          variant: "destructive",
        })
      } finally {
        setBusy(false)
      }
    },
    [loadData, toast],
  )

  const stats = useMemo(() => {
    let totalHabitaciones = 0
    let totalCamas = 0
    let totalAsignadas = 0

    for (const edificio of edificios) {
      totalHabitaciones += edificio.habitaciones.length
      totalCamas += edificio.habitaciones.reduce((acc, room) => acc + room.camas_total, 0)
      totalAsignadas += edificio.habitaciones.reduce((acc, room) => acc + room.asignaciones.length, 0)
    }

    const camasDisponibles = Math.max(totalCamas - totalAsignadas, 0)
    const porcentajeOcupacion = totalCamas > 0 ? Math.round((totalAsignadas / totalCamas) * 100) : 0

    return { totalHabitaciones, totalCamas, camasDisponibles, porcentajeOcupacion }
  }, [edificios])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Módulo de Alojamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Edificios: {edificios.length}</span>
          <span>Habitaciones: {stats.totalHabitaciones}</span>
          <span>Camas configuradas: {stats.totalCamas}</span>
          <span>Camas disponibles: {stats.camasDisponibles}</span>
          <span>Porcentaje de ocupación: {stats.porcentajeOcupacion}%</span>
          <span>Personas sin asignar: {personasDisponibles.length}</span>
        </CardContent>
      </Card>

      <Tabs defaultValue="asignacion" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="asignacion" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            Asignación visual
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asignacion">
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Cargando vista de asignación...</CardContent>
            </Card>
          ) : (
            <AsignacionVisual
              edificios={edificios}
              personasDisponibles={personasDisponibles}
              busy={busy}
              onAssign={(payload) =>
                runMutation(
                  () =>
                    fetch("/api/alojamiento/asignaciones", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }),
                  "Asignación creada",
                )
              }
              onUnassign={(asignacionId) =>
                runMutation(
                  () => fetch(`/api/alojamiento/asignaciones/${asignacionId}`, { method: "DELETE" }),
                  "Asignación eliminada",
                )
              }
            />
          )}
        </TabsContent>

        <TabsContent value="configuracion">
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Cargando configuración de alojamiento...</CardContent>
            </Card>
          ) : (
            <EdificiosConfig
              edificios={edificios}
              busy={busy}
              onCreateEdificio={(payload) =>
                runMutation(
                  () =>
                    fetch("/api/alojamiento/edificios", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }),
                  "Edificio creado",
                )
              }
              onUpdateEdificio={(id, payload) =>
                runMutation(
                  () =>
                    fetch(`/api/alojamiento/edificios/${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }),
                  "Edificio actualizado",
                )
              }
              onDeleteEdificio={(id) =>
                runMutation(() => fetch(`/api/alojamiento/edificios/${id}`, { method: "DELETE" }), "Edificio eliminado")
              }
              onCreateHabitacion={(payload) =>
                runMutation(
                  () =>
                    fetch("/api/alojamiento/habitaciones", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }),
                  "Habitación creada",
                )
              }
              onUpdateHabitacion={(id, payload) =>
                runMutation(
                  () =>
                    fetch(`/api/alojamiento/habitaciones/${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }),
                  "Habitación actualizada",
                )
              }
              onDeleteHabitacion={(id) =>
                runMutation(() => fetch(`/api/alojamiento/habitaciones/${id}`, { method: "DELETE" }), "Habitación eliminada")
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
