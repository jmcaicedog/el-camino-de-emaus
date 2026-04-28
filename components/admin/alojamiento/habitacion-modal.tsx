"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { HabitacionConAsignaciones, PersonaAlojamientoResumen } from "@/lib/types"

interface HabitacionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habitacion: HabitacionConAsignaciones | null
  personasDisponibles: PersonaAlojamientoResumen[]
  onAssign: (payload: { habitacion_id: string; persona_id: string; persona_tipo: "caminante" | "servidor"; cama_numero: number }) => Promise<void>
  onUnassign: (asignacionId: string) => Promise<void>
  busy: boolean
}

export function HabitacionModal({
  open,
  onOpenChange,
  habitacion,
  personasDisponibles,
  onAssign,
  onUnassign,
  busy,
}: HabitacionModalProps) {
  const [search, setSearch] = useState("")

  const assignedByBed = useMemo(() => {
    const map = new Map<number, HabitacionConAsignaciones["asignaciones"][number]>()
    for (const asignacion of habitacion?.asignaciones || []) {
      map.set(asignacion.cama_numero, asignacion)
    }
    return map
  }, [habitacion])

  const firstFreeBed = useMemo(() => {
    if (!habitacion) return null
    for (let bed = 1; bed <= habitacion.camas_total; bed += 1) {
      if (!assignedByBed.has(bed)) return bed
    }
    return null
  }, [habitacion, assignedByBed])

  const beds = useMemo(() => {
    if (!habitacion) return []
    return Array.from({ length: habitacion.camas_total }, (_, i) => i + 1)
  }, [habitacion])

  const personasFiltradasOrdenadas = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase("es")
    const collator = new Intl.Collator("es", { sensitivity: "base" })

    return [...personasDisponibles]
      .filter((persona) => {
        if (!searchTerm) return true
        return persona.nombre_completo.toLocaleLowerCase("es").includes(searchTerm)
      })
      .sort((a, b) => {
        if (a.persona_tipo !== b.persona_tipo) {
          return a.persona_tipo === "caminante" ? -1 : 1
        }
        return collator.compare(a.nombre_completo, b.nombre_completo)
      })
  }, [personasDisponibles, search])

  useEffect(() => {
    if (open) {
      setSearch("")
    }
  }, [open, habitacion?.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)]! sm:max-w-5xl!">
        <DialogHeader>
          <DialogTitle>{habitacion ? `Habitación ${habitacion.nombre}` : "Habitación"}</DialogTitle>
          <DialogDescription>
            Asigna o libera camas. Las personas marcadas con "ronca" ayudan a distribuir mejor la convivencia.
          </DialogDescription>
        </DialogHeader>

        {!habitacion ? null : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Camas ({habitacion.camas_total})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {beds.map((bedNumber) => {
                  const asignacion = assignedByBed.get(bedNumber)
                  const isOccupied = Boolean(asignacion)

                  return (
                    <div
                      key={bedNumber}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                        isOccupied ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Cama {bedNumber}</span>
                        {isOccupied ? (
                          <span className="text-sm text-muted-foreground">
                            {asignacion.persona_nombre}
                            {asignacion.ronca_al_dormir ? " · ronca" : ""}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Libre</span>
                        )}
                      </div>

                      {isOccupied ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void onUnassign(asignacion.id)}
                        >
                          Liberar
                        </Button>
                      ) : (
                        <Badge variant="secondary">Disponible</Badge>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personas sin asignar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre..."
                  aria-label="Buscar persona por nombre"
                />

                {personasDisponibles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay personas disponibles para asignar.</p>
                ) : personasFiltradasOrdenadas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se encontraron personas con ese criterio.</p>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-auto pr-1">
                    {personasFiltradasOrdenadas.map((persona) => (
                      <div
                        key={`${persona.persona_tipo}-${persona.id}`}
                        className={`grid min-h-20 grid-cols-[1fr_auto] items-center gap-3 rounded-md border px-3 py-2 ${
                          persona.ronca_al_dormir ? "border-rose-300 bg-rose-50" : ""
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={persona.persona_tipo === "caminante" ? "default" : "secondary"}
                              className={
                                persona.persona_tipo === "servidor"
                                  ? "border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-100"
                                  : ""
                              }
                            >
                              {persona.persona_tipo}
                            </Badge>
                            {persona.ronca_al_dormir ? (
                              <Badge className="bg-rose-600 text-white hover:bg-rose-700">Ronca</Badge>
                            ) : null}
                          </div>
                          <div className="text-sm leading-tight">
                            <div className="wrap-break-word font-medium">{persona.nombre_completo}</div>
                            <div className="text-muted-foreground text-xs sm:text-sm">
                              {typeof persona.edad === "number" ? `Edad: ${persona.edad} años` : "Edad no registrada"}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0"
                          disabled={busy || firstFreeBed === null}
                          onClick={() => {
                            if (!habitacion || firstFreeBed === null) return
                            void onAssign({
                              habitacion_id: habitacion.id,
                              persona_id: persona.id,
                              persona_tipo: persona.persona_tipo,
                              cama_numero: firstFreeBed,
                            })
                          }}
                        >
                          Asignar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
