"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CircleX } from "lucide-react"
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
                  const roomState = habitacion.camas_total === 0 ? "noBeds" : ocupadas === 0 ? "empty" : libres === 0 ? "full" : "partial"

                  const roomClasses =
                    roomState === "noBeds"
                      ? "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : roomState === "full"
                      ? "border-red-300 bg-red-50 hover:bg-red-100"
                      : roomState === "empty"
                        ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                        : "border-amber-300 bg-amber-50 hover:bg-amber-100"

                  return (
                    <Button
                      key={habitacion.id}
                      variant="outline"
                      className={`h-auto justify-start p-3 ${roomClasses}`}
                      disabled={habitacion.camas_total === 0}
                      onClick={() => openHabitacion(habitacion)}
                    >
                      <div className="w-full text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold">{habitacion.nombre}</div>
                          <div className="flex shrink-0 flex-wrap justify-end gap-1">
                          {Array.from({ length: habitacion.camas_total }, (_, i) => i + 1).map((bedNumber) => {
                            const assignment = habitacion.asignaciones.find((a) => a.cama_numero === bedNumber)
                            if (!assignment) {
                              return (
                                <span
                                  key={bedNumber}
                                  className="h-3.5 w-3.5 rounded-full border border-slate-400 bg-white"
                                  title={`Cama ${bedNumber} libre`}
                                />
                              )
                            }

                            return (
                              <CircleX
                                key={bedNumber}
                                className="h-3.5 w-3.5 text-red-600"
                                aria-label={`Cama ${bedNumber} ocupada por ${assignment.persona_nombre}`}
                              />
                            )
                          })}
                          </div>
                        </div>
                        {habitacion.camas_total === 0 ? <div className="mt-1 text-xs">Sin camas</div> : null}
                        {habitacion.asignaciones.length > 0 ? (
                          <div className="mt-2 space-y-0.5 text-[10px] leading-tight text-slate-700">
                            {[...habitacion.asignaciones]
                              .sort((a, b) => a.cama_numero - b.cama_numero)
                              .map((asignacion) => (
                                <div key={asignacion.id} className="flex items-center gap-1">
                                  <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                      asignacion.ronca_al_dormir ? "bg-rose-600" : "bg-emerald-600"
                                    }`}
                                    title={asignacion.ronca_al_dormir ? "Ronca" : "No ronca"}
                                  />
                                  <span className="truncate">{asignacion.persona_nombre}</span>
                                </div>
                              ))}
                          </div>
                        ) : null}
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
