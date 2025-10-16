"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Mail, ImageIcon, Pill, UtensilsCrossed, Phone, MapPin, Heart, Loader2 } from "lucide-react"
import Image from "next/image"
import { uiAvatarUrl } from "@/lib/utils"
import type { Caminante } from "@/lib/types"

interface CaminanteCardProps {
  caminante: Caminante
  onUpdate: () => void
}

export function CaminanteCard({ caminante, onUpdate }: CaminanteCardProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditingMedical, setIsEditingMedical] = useState(false)
  const [medicamentos, setMedicamentos] = useState(caminante.medicamentos || "")
  const [restricciones, setRestricciones] = useState(caminante.restricciones_alimenticias || "")

  const updateTracking = async (field: "cartas_recibidas" | "fotos_recibidas", increment: number) => {
    setIsUpdating(true)
    try {
      const newValue = Math.max(0, caminante[field] + increment)

      const response = await fetch(`/api/caminantes/${caminante.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      })

      if (!response.ok) throw new Error("Error al actualizar")

      toast({
        title: "Actualizado",
        description: `${field === "cartas_recibidas" ? "Cartas" : "Fotos"} actualizado correctamente`,
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateMedicalInfo = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/caminantes/${caminante.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicamentos,
          restricciones_alimenticias: restricciones,
        }),
      })

      if (!response.ok) throw new Error("Error al actualizar")

      toast({
        title: "Actualizado",
        description: "Información médica actualizada correctamente",
      })

      setIsEditingMedical(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar información médica",
        variant: "destructive",
      })
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

      // Upload to server endpoint
      const upRes = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, filename: file.name }),
      })

      if (!upRes.ok) throw new Error('Error al subir imagen')
      const { url } = await upRes.json()

      // Save to caminante record
      const res = await fetch(`/api/caminantes/${caminante.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: url }),
      })

      if (!res.ok) throw new Error('Error al guardar imagen')

      toast({ title: 'Actualizado', description: 'Foto actualizada correctamente' })
      onUpdate()
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
              src={caminante.imagen || uiAvatarUrl(caminante.nombre_completo)}
              alt={caminante.nombre_completo}
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-lg">{caminante.nombre_completo}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{caminante.celular}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{caminante.ciudad}</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span>Tipo de sangre: {caminante.tipo_sangre}</span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">Cartas recibidas</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTracking("cartas_recibidas", -1)}
                disabled={isUpdating || caminante.cartas_recibidas === 0}
              >
                -
              </Button>
              <Badge variant="secondary" className="min-w-[2rem] justify-center">
                {caminante.cartas_recibidas}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTracking("cartas_recibidas", 1)}
                disabled={isUpdating}
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Fotos recibidas</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTracking("fotos_recibidas", -1)}
                disabled={isUpdating || caminante.fotos_recibidas === 0}
              >
                -
              </Button>
              <Badge variant="secondary" className="min-w-[2rem] justify-center">
                {caminante.fotos_recibidas}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTracking("fotos_recibidas", 1)}
                disabled={isUpdating}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={isEditingMedical} onOpenChange={setIsEditingMedical}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              <Pill className="mr-2 h-4 w-4" />
              Ver/Editar Información Médica
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Información Médica - {caminante.nombre_completo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="medicamentos">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4" />
                    Medicamentos
                  </div>
                </Label>
                <Textarea
                  id="medicamentos"
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  placeholder="Lista de medicamentos..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="restricciones">
                  <div className="flex items-center gap-2 mb-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Restricciones Alimenticias
                  </div>
                </Label>
                <Textarea
                  id="restricciones"
                  value={restricciones}
                  onChange={(e) => setRestricciones(e.target.value)}
                  placeholder="Alergias o restricciones..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditingMedical(false)} disabled={isUpdating}>
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

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full text-xs">
              Ver información completa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{caminante.nombre_completo}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-end mb-2">
              <input
                id={`caminante-file-input-${caminante.id}`}
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
                aria-label={`Cambiar foto de ${caminante.nombre_completo}`}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md text-primary hover:bg-primary/10"
                onClick={() => {
                  const el = document.getElementById(`caminante-file-input-${caminante.id}`) as HTMLInputElement | null
                  if (el) el.click()
                }}
              >
                <ImageIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-center mb-4">
                <img
                  src={caminante.imagen || uiAvatarUrl(caminante.nombre_completo, 512)}
                  alt={caminante.nombre_completo}
                  className="rounded-full max-h-32 w-auto object-cover"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Cédula:</span> {caminante.cedula}
                </div>
                <div>
                  <span className="font-medium">Edad:</span> {caminante.edad} años
                </div>
                <div>
                  <span className="font-medium">Celular:</span> {caminante.celular}
                </div>
                <div>
                  <span className="font-medium">Correo:</span> {caminante.correo}
                </div>
                <div>
                  <span className="font-medium">Ciudad:</span> {caminante.ciudad}
                </div>
                <div>
                  <span className="font-medium">Estado Civil:</span> {caminante.estado_civil}
                </div>
                <div>
                  <span className="font-medium">Profesión:</span> {caminante.profesion}
                </div>
                <div>
                  <span className="font-medium">EPS:</span> {caminante.eps}
                </div>
                <div>
                  <span className="font-medium">Tipo de Sangre:</span> {caminante.tipo_sangre}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Contactos de emergencia</h3>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Nombre:</span> {caminante.nombre_contacto_emergencia}
                  </div>
                  <div>
                    <span className="font-medium">Parentesco:</span> {caminante.parentesco_contacto}
                  </div>
                  <div className="pb-2">
                    <span className="font-medium">Celular:</span> {caminante.celular_contacto}
                  </div>

                  {caminante.nombre_contacto_emergencia_2 && (
                    <div className="space-y-1">
                      <div>
                        <span className="font-medium">Nombre:</span> {caminante.nombre_contacto_emergencia_2}
                      </div>
                      <div>
                        <span className="font-medium">Parentesco:</span> {caminante.parentesco_contacto_2}
                      </div>
                      <div>
                        <span className="font-medium">Celular:</span> {caminante.celular_contacto_2}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(caminante.medicamentos || caminante.restricciones_alimenticias) && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Información Médica</h3>
                  {caminante.medicamentos && (
                    <div className="mb-2">
                      <span className="font-medium">Medicamentos:</span>
                      <p className="text-muted-foreground">{caminante.medicamentos}</p>
                    </div>
                  )}
                  {caminante.restricciones_alimenticias && (
                    <div>
                      <span className="font-medium">Restricciones Alimenticias:</span>
                      <p className="text-muted-foreground">{caminante.restricciones_alimenticias}</p>
                    </div>
                  )}
                </div>
              )}
              {/* Información Espiritual */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Información Espiritual</h3>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Parroquia:</span> {caminante.parroquia || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Párroco:</span> {caminante.parroco || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Retiro sorpresa:</span> {caminante.es_sorpresa ? 'Sí' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Sacramentos recibidos:</span>
                    {caminante.sacramentos_recibidos && caminante.sacramentos_recibidos.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {caminante.sacramentos_recibidos.map((s, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sin información registrada</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de Invitación */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Información de Invitación</h3>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Quien invitó:</span> {caminante.quien_invito || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Invitador hizo retiro:</span> {caminante.invitador_hizo_retiro ? 'Sí' : 'No'}
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Información Laboral</h3>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Profesión:</span> {caminante.profesion || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Empresa:</span> {caminante.empresa || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Cargo:</span> {caminante.cargo || '-'}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
