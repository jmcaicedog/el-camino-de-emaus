"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { EdificioConHabitaciones } from "@/lib/types"

interface EdificiosConfigProps {
  edificios: EdificioConHabitaciones[]
  onCreateEdificio: (payload: { nombre: string; habitaciones_count: number; camas_por_habitacion: number }) => Promise<void>
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
  const [newEdificioRoomsCount, setNewEdificioRoomsCount] = useState(0)
  const [newEdificioBedsPerRoom, setNewEdificioBedsPerRoom] = useState(1)
  const [newRoomByBuilding, setNewRoomByBuilding] = useState<Record<string, { nombre: string; camas_total: number }>>({})
  const [confirmDeleteBuildingId, setConfirmDeleteBuildingId] = useState<string | null>(null)

  const buildingToDelete = edificios.find((e) => e.id === confirmDeleteBuildingId) || null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo edificio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="edificio-nombre">Nombre</Label>
            <Input
              id="edificio-nombre"
              value={newEdificioName}
              onChange={(e) => setNewEdificioName(e.target.value)}
              placeholder="Ej: Casa San José"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edificio-habitaciones">Habitaciones iniciales</Label>
            <Input
              id="edificio-habitaciones"
              type="number"
              min={0}
              value={newEdificioRoomsCount}
              onChange={(e) => setNewEdificioRoomsCount(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edificio-camas">Camas por habitación</Label>
            <Input
              id="edificio-camas"
              type="number"
              min={1}
              value={newEdificioBedsPerRoom}
              onChange={(e) => setNewEdificioBedsPerRoom(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <Button
            disabled={busy || newEdificioName.trim().length === 0}
            onClick={() => {
              void onCreateEdificio({
                nombre: newEdificioName.trim(),
                habitaciones_count: Math.max(0, newEdificioRoomsCount),
                camas_por_habitacion: Math.max(1, newEdificioBedsPerRoom),
              }).then(() => {
                setNewEdificioName("")
                setNewEdificioRoomsCount(0)
                setNewEdificioBedsPerRoom(1)
              })
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
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setConfirmDeleteBuildingId(edificio.id)}
                >
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
                            camas_total: prev[edificio.id]?.camas_total || 1,
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
                      value={newRoomByBuilding[edificio.id]?.camas_total || 1}
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
                          [edificio.id]: { nombre: "", camas_total: 1 },
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

      <ConfirmDialog
        open={Boolean(confirmDeleteBuildingId)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteBuildingId(null)
          }
        }}
        title="Eliminar edificio"
        description={
          buildingToDelete
            ? `Se eliminará el edificio "${buildingToDelete.nombre}" junto con todas sus habitaciones y asignaciones. Esta acción no se puede deshacer.`
            : "Se eliminará el edificio con todas sus habitaciones y asignaciones. Esta acción no se puede deshacer."
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          if (!confirmDeleteBuildingId) return
          await onDeleteEdificio(confirmDeleteBuildingId)
          setConfirmDeleteBuildingId(null)
        }}
      />
    </div>
  )
}
