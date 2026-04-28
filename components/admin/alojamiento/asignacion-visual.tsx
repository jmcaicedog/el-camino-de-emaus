"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HabitacionModal } from "@/components/admin/alojamiento/habitacion-modal"
import type { EdificioConHabitaciones, HabitacionConAsignaciones, PersonaAlojamientoResumen } from "@/lib/types"

interface AsignacionVisualProps {
  edificios: EdificioConHabitaciones[]
  personasDisponibles: PersonaAlojamientoResumen[]
  onAssign: (payload: { habitacion_id: string; persona_id: string; persona_tipo: "caminante" | "servidor"; cama_numero: number }) => Promise<void>
  onUnassign: (asignacionId: string) => Promise<void>
  busy: boolean
}

export function AsignacionVisual({ edificios, personasDisponibles, onAssign, onUnassign, busy }: AsignacionVisualProps) {
  const [selectedHabitacion, setSelectedHabitacion] = useState<HabitacionConAsignaciones | null>(null)
  const [open, setOpen] = useState(false)

  const summary = useMemo(() => {
    let totalBeds = 0
    let totalAssigned = 0

    for (const edificio of edificios) {
      for (const habitacion of edificio.habitaciones) {
        totalBeds += habitacion.camas_total
        totalAssigned += habitacion.asignaciones.length
      }
    }

    return {
      totalBeds,
      totalAssigned,
      totalFree: Math.max(totalBeds - totalAssigned, 0),
    }
  }, [edificios])

  const openHabitacion = (habitacion: HabitacionConAsignaciones) => {
    setSelectedHabitacion(habitacion)
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de alojamiento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Camas totales: {summary.totalBeds}</Badge>
          <Badge variant="secondary">Ocupadas: {summary.totalAssigned}</Badge>
          <Badge variant="secondary">Libres: {summary.totalFree}</Badge>
          <Badge variant="outline">Sin asignar: {personasDisponibles.length}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {edificios.map((edificio) => (
          <Card key={edificio.id}>
            <CardHeader>
              <CardTitle className="text-base">{edificio.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {edificio.habitaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este edificio todavía no tiene habitaciones configuradas.</p>
              ) : (
                edificio.habitaciones.map((habitacion) => {
                  const ocupadas = habitacion.asignaciones.length
                  const libres = Math.max(habitacion.camas_total - ocupadas, 0)
                  const roomState = ocupadas === 0 ? "empty" : libres === 0 ? "full" : "partial"

                  const roomClasses =
                    roomState === "full"
                      ? "border-red-300 bg-red-50 hover:bg-red-100"
                      : roomState === "empty"
                        ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                        : "border-amber-300 bg-amber-50 hover:bg-amber-100"

                  const dotFreeClass = roomState === "full" ? "bg-red-200" : roomState === "empty" ? "bg-emerald-300" : "bg-amber-300"

                  const dotAssignedClass =
                    roomState === "full"
                      ? "bg-red-600"
                      : roomState === "empty"
                        ? "bg-emerald-600"
                        : "bg-amber-600"

                  return (
                    <Button
                      key={habitacion.id}
                      variant="outline"
                      className={`h-auto justify-start p-3 ${roomClasses}`}
                      onClick={() => openHabitacion(habitacion)}
                    >
                      <div className="w-full text-left">
                        <div className="font-semibold">{habitacion.nombre}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary">{ocupadas} ocupadas</Badge>
                          <Badge variant="outline">{libres} libres</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Array.from({ length: habitacion.camas_total }, (_, i) => i + 1).map((bedNumber) => {
                            const assignment = habitacion.asignaciones.find((a) => a.cama_numero === bedNumber)
                            if (!assignment) {
                              return <span key={bedNumber} className={`h-2.5 w-2.5 rounded-full ${dotFreeClass}`} />
                            }

                            const typeRing = assignment.persona_tipo === "caminante" ? "ring-blue-900/30" : "ring-emerald-900/30"
                            return (
                              <span
                                key={bedNumber}
                                className={`h-2.5 w-2.5 rounded-full ring-1 ${dotAssignedClass} ${typeRing}`}
                                title={`${assignment.persona_nombre}${assignment.ronca_al_dormir ? " (ronca)" : ""}`}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </Button>
                  )
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <HabitacionModal
        open={open}
        onOpenChange={setOpen}
        habitacion={selectedHabitacion}
        personasDisponibles={personasDisponibles}
        onAssign={onAssign}
        onUnassign={onUnassign}
        busy={busy}
      />
    </div>
  )
}
