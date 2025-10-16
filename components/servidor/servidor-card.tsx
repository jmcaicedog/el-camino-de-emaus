"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef } from "react"
import { Phone, MapPin, Loader2, Pill, UtensilsCrossed } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { Servidor } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ServidorCardProps {
  servidor: Servidor
  onClose?: () => void
  onUpdate?: () => void
}

export function ServidorCard({ servidor, onUpdate }: ServidorCardProps) {
  const { toast } = useToast()
  const [medicamentos, setMedicamentos] = useState(servidor.medicamentos || "")
  const [restricciones, setRestricciones] = useState(servidor.restricciones_alimenticias || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const updateMedicalInfo = async () => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/servidores/${servidor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicamentos, restricciones_alimenticias: restricciones }),
      })

      if (!res.ok) throw new Error("Error al actualizar")

      toast({ title: "Actualizado", description: "Información médica actualizada" })
      setIsEditing(false)
      if (typeof onUpdate === "function") onUpdate()
    } catch (e) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageChange = async (file?: File) => {
    if (!file) return
    setIsUpdating(true)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload = () => res(reader.result as string)
        reader.onerror = rej
        reader.readAsDataURL(file)
      })

      const upRes = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, filename: file.name }),
      })

      if (!upRes.ok) throw new Error('Error al subir imagen')
      const { url } = await upRes.json()

      const res = await fetch(`/api/servidores/${servidor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: url }),
      })

      if (!res.ok) throw new Error('Error al guardar imagen')

      toast({ title: 'Actualizado', description: 'Foto actualizada correctamente' })
      if (typeof onUpdate === 'function') onUpdate()
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'No se pudo actualizar la imagen', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <img
              src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo)}
              alt={servidor.nombre_completo}
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-lg">{servidor.nombre_completo}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{servidor.celular}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{servidor.ciudad}</span>
          </div>
          <div>
            <span className="font-medium">Profesión:</span> {servidor.profesion || "-"}
          </div>
          <div>
            <span className="font-medium">Empresa / Cargo:</span> {servidor.empresa || "-"} {servidor.cargo ? ` / ${servidor.cargo}` : ""}
          </div>
          <div>
            <span className="font-medium">Talla Camisa:</span> {servidor.talla_camisa || "-"}
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Contactos de emergencia</h3>
          <div className="space-y-1">
            <div>
              <span className="font-medium">Nombre:</span> {servidor.nombre_contacto_emergencia}
            </div>
            <div>
              <span className="font-medium">Parentesco:</span> {servidor.parentesco_contacto}
            </div>
            <div>
              <span className="font-medium">Celular:</span> {servidor.celular_contacto}
            </div>
            {servidor.nombre_contacto_emergencia_2 && (
              <div className="pt-2">
                <div>
                  <span className="font-medium">Nombre:</span> {servidor.nombre_contacto_emergencia_2}
                </div>
                <div>
                  <span className="font-medium">Parentesco:</span> {servidor.parentesco_contacto_2}
                </div>
                <div>
                  <span className="font-medium">Celular:</span> {servidor.celular_contacto_2}
                </div>
              </div>
            )}
          </div>
        </div>

        {servidor.medicamentos && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Información Médica</h3>
            <p className="text-muted-foreground">{servidor.medicamentos}</p>
          </div>
        )}

        <div className="space-y-2">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full bg-transparent">
                <Pill className="mr-2 h-4 w-4" />
                Ver/Editar Información Médica
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Información Médica - {servidor.nombre_completo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="medicamentos">Medicamentos</Label>
                  <Textarea id="medicamentos" value={medicamentos} onChange={(e) => setMedicamentos(e.target.value)} rows={4} />
                </div>

                <div>
                  <Label htmlFor="restricciones">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="h-4 w-4" />
                      Restricciones Alimenticias
                    </div>
                  </Label>
                  <Textarea id="restricciones" value={restricciones} onChange={(e) => setRestricciones(e.target.value)} rows={4} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                    Cancelar
                  </Button>
                  <Button onClick={updateMedicalInfo} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewing} onOpenChange={setIsViewing}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full text-xs">
                Ver información completa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{servidor.nombre_completo}</DialogTitle>
              </DialogHeader>
                <div className="flex justify-end mb-2">
                    <input
                      id={`servidor-file-input-${servidor.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.currentTarget.files?.[0]
                        if (f) handleImageChange(f)
                      }}
                    />
                    <button
                      type="button"
                      className="text-sm text-primary underline"
                      onClick={() => {
                        const el = document.getElementById(`servidor-file-input-${servidor.id}`) as HTMLInputElement | null
                        if (el) el.click()
                      }}
                    >
                      Cambiar foto
                    </button>
                </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-center mb-4">
                  <img
                    src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo, 512)}
                    alt={servidor.nombre_completo}
                    className="rounded-md max-h-64 object-contain"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Cédula:</span> {servidor.cedula}
                  </div>
                  <div>
                    <span className="font-medium">Edad:</span> {servidor.edad} años
                  </div>
                  <div>
                    <span className="font-medium">Celular:</span> {servidor.celular}
                  </div>
                  <div>
                    <span className="font-medium">Correo:</span> {servidor.correo}
                  </div>
                  <div>
                    <span className="font-medium">Ciudad:</span> {servidor.ciudad}
                  </div>
                  <div>
                    <span className="font-medium">Estado Civil:</span> {servidor.estado_civil}
                  </div>
                  <div>
                    <span className="font-medium">Profesión:</span> {servidor.profesion || "-"}
                  </div>
                  <div>
                    <span className="font-medium">EPS:</span> {servidor.eps}
                  </div>
                  <div>
                    <span className="font-medium">Tipo de Sangre:</span> {servidor.tipo_sangre}
                  </div>
                  <div>
                    <span className="font-medium">Parroquia:</span> {servidor.parroquia}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Contactos de emergencia</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Nombre:</span> {servidor.nombre_contacto_emergencia}
                    </div>
                    <div>
                      <span className="font-medium">Parentesco:</span> {servidor.parentesco_contacto}
                    </div>
                    <div>
                      <span className="font-medium">Celular:</span> {servidor.celular_contacto}
                    </div>

                    {servidor.nombre_contacto_emergencia_2 && (
                      <div className="pt-2">
                        <div>
                          <span className="font-medium">Nombre:</span> {servidor.nombre_contacto_emergencia_2}
                        </div>
                        <div>
                          <span className="font-medium">Parentesco:</span> {servidor.parentesco_contacto_2}
                        </div>
                        <div>
                          <span className="font-medium">Celular:</span> {servidor.celular_contacto_2}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {(servidor.medicamentos || servidor.restricciones_alimenticias) && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Información Médica</h3>
                    {servidor.medicamentos && (
                      <div className="mb-2">
                        <span className="font-medium">Medicamentos:</span>
                        <p className="text-muted-foreground">{servidor.medicamentos}</p>
                      </div>
                    )}
                    {servidor.restricciones_alimenticias && (
                      <div>
                        <span className="font-medium">Restricciones Alimenticias:</span>
                        <p className="text-muted-foreground">{servidor.restricciones_alimenticias}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Información Espiritual */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Información Espiritual</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Parroquia:</span> {servidor.parroquia || '-'}
                    </div>
                    <div>
                      <span className="font-medium">Párroco:</span> {servidor.parroco || '-'}
                    </div>
                  </div>
                </div>

                {/* Información de Invitación / Experiencia */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Información de Servicio</h3>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Retiros anteriores:</span> {servidor.retiros_anteriores ?? '-'}
                    </div>
                    <div>
                      <span className="font-medium">Experiencia en servicio:</span>
                      <div className="text-muted-foreground">{servidor.experiencia_servicio || 'Sin información registrada'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
