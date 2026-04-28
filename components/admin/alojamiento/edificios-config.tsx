"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { EdificioConHabitaciones } from "@/lib/types"

interface EdificiosConfigProps {
  edificios: EdificioConHabitaciones[]
  onCreateEdificio: (payload: { nombre: string }) => Promise<void>
  onUpdateEdificio: (id: string, payload: { nombre: string }) => Promise<void>
  onDeleteEdificio: (id: string) => Promise<void>
  onCreateHabitacion: (payload: { edificio_id: string; nombre: string; camas_total: number }) => Promise<void>
  onUpdateHabitacion: (id: string, payload: { nombre: string; camas_total: number }) => Promise<void>
  onDeleteHabitacion: (id: string) => Promise<void>
  busy: boolean
}

export function EdificiosConfig({
  edificios,
  onCreateEdificio,
  onUpdateEdificio,
  onDeleteEdificio,
  onCreateHabitacion,
  onUpdateHabitacion,
  onDeleteHabitacion,
  busy,
}: EdificiosConfigProps) {
  const [newEdificioName, setNewEdificioName] = useState("")
  const [newRoomByBuilding, setNewRoomByBuilding] = useState<Record<string, { nombre: string; camas_total: number }>>({})

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo edificio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="edificio-nombre">Nombre</Label>
            <Input
              id="edificio-nombre"
              value={newEdificioName}
              onChange={(e) => setNewEdificioName(e.target.value)}
              placeholder="Ej: Casa San José"
            />
          </div>
          <Button
            disabled={busy || newEdificioName.trim().length === 0}
            onClick={() => {
              void onCreateEdificio({ nombre: newEdificioName.trim() }).then(() => setNewEdificioName(""))
            }}
          >
            Agregar edificio
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {edificios.map((edificio) => (
          <Card key={edificio.id}>
            <CardHeader>
              <CardTitle className="text-base">{edificio.nombre}</CardTitle>
              <Badge variant="outline" className="mt-1 w-fit">
                Habitaciones: {edificio.habitaciones.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label>Renombrar edificio</Label>
                  <Input
                    defaultValue={edificio.nombre}
                    onBlur={(e) => {
                      const value = e.target.value.trim()
                      if (value && value !== edificio.nombre) {
                        void onUpdateEdificio(edificio.id, { nombre: value })
                      }
                    }}
                  />
                </div>
                <Button variant="destructive" disabled={busy} onClick={() => void onDeleteEdificio(edificio.id)}>
                  Eliminar edificio
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Agregar habitación</h4>
                <div className="grid gap-2 md:grid-cols-[1fr_150px_auto] md:items-end">
                  <div className="space-y-1">
                    <Label>Nombre habitación</Label>
                    <Input
                      value={newRoomByBuilding[edificio.id]?.nombre || ""}
                      onChange={(e) =>
                        setNewRoomByBuilding((prev) => ({
                          ...prev,
                          [edificio.id]: {
                            nombre: e.target.value,
                            camas_total: prev[edificio.id]?.camas_total || 4,
                          },
                        }))
                      }
                      placeholder="Ej: Habitación 101"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Camas</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newRoomByBuilding[edificio.id]?.camas_total || 4}
                      onChange={(e) =>
                        setNewRoomByBuilding((prev) => ({
                          ...prev,
                          [edificio.id]: {
                            nombre: prev[edificio.id]?.nombre || "",
                            camas_total: Math.max(1, Number(e.target.value) || 1),
                          },
                        }))
                      }
                    />
                  </div>
                  <Button
                    disabled={busy || !(newRoomByBuilding[edificio.id]?.nombre || "").trim()}
                    onClick={() => {
                      const payload = newRoomByBuilding[edificio.id]
                      if (!payload?.nombre?.trim()) return
                      void onCreateHabitacion({
                        edificio_id: edificio.id,
                        nombre: payload.nombre.trim(),
                        camas_total: Math.max(1, payload.camas_total || 1),
                      }).then(() => {
                        setNewRoomByBuilding((prev) => ({
                          ...prev,
                          [edificio.id]: { nombre: "", camas_total: 4 },
                        }))
                      })
                    }}
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {edificio.habitaciones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay habitaciones en este edificio.</p>
                ) : (
                  edificio.habitaciones.map((habitacion) => (
                    <div key={habitacion.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_140px_auto] md:items-end">
                      <div className="space-y-1">
                        <Label>Nombre</Label>
                        <Input
                          defaultValue={habitacion.nombre}
                          onBlur={(e) => {
                            const value = e.target.value.trim()
                            if (value && value !== habitacion.nombre) {
                              void onUpdateHabitacion(habitacion.id, {
                                nombre: value,
                                camas_total: habitacion.camas_total,
                              })
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Camas</Label>
                        <Input
                          type="number"
                          min={1}
                          defaultValue={habitacion.camas_total}
                          onBlur={(e) => {
                            const nextBeds = Math.max(1, Number(e.target.value) || 1)
                            if (nextBeds !== habitacion.camas_total) {
                              void onUpdateHabitacion(habitacion.id, {
                                nombre: habitacion.nombre,
                                camas_total: nextBeds,
                              })
                            }
                          }}
                        />
                      </div>
                      <Button variant="destructive" disabled={busy} onClick={() => void onDeleteHabitacion(habitacion.id)}>
                        Eliminar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
