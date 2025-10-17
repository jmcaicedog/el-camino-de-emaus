"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ImageIcon, Phone, MapPin, Loader2, Pill, UtensilsCrossed } from "lucide-react"
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
      const newValue = Math.max(0, (caminante as any)[field] + increment)

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

      const upRes = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, filename: file.name }),
      })

      if (!upRes.ok) throw new Error("Error al subir imagen")
      const { url } = await upRes.json()

      const res = await fetch(`/api/caminantes/${caminante.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: url }),
      })

      if (!res.ok) throw new Error("Error al guardar imagen")

      toast({ title: "Actualizado", description: "Foto actualizada correctamente" })
      if (typeof onUpdate === "function") onUpdate()
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "No se pudo actualizar la imagen", variant: "destructive" })
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

      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{caminante.celular}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{caminante.ciudad}</span>
          </div>
          <div>
            <span className="font-medium">Profesión:</span> {caminante.profesion || "-"}
          </div>
        </div>

        <div className="space-y-2">
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

              {/* input y botón de cambiar foto se muestran como overlay en el avatar */}

              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-[36%_1fr] gap-6 items-start">
                  <div className="relative flex-shrink-0">
                    <img
                      src={caminante.imagen || uiAvatarUrl(caminante.nombre_completo, 512)}
                      alt={caminante.nombre_completo}
                      className="rounded-full h-36 w-36 object-cover shadow-lg"
                    />
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
                      title="Cambiar foto"
                      className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-neutral-100"
                      onClick={() => {
                        const el = document.getElementById(`caminante-file-input-${caminante.id}`) as HTMLInputElement | null
                        if (el) el.click()
                      }}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Cédula</div>
                      <div className="truncate">{caminante.cedula}</div>
                    </div>
                    <div>
                      <div className="font-medium">Edad</div>
                      <div className="truncate">{caminante.edad} años</div>
                    </div>
                    <div>
                      <div className="font-medium">Celular</div>
                      <div className="truncate">{caminante.celular}</div>
                    </div>
                    <div>
                      <div className="font-medium">Ciudad</div>
                      <div className="truncate">{caminante.ciudad || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Estado civil</div>
                      <div className="truncate">{caminante.estado_civil || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Correo</div>
                      <div className="truncate" title={caminante.correo}>{caminante.correo}</div>
                    </div>
                  </div>
                </div>

                <section className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Contactos de emergencia</h3>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-3 gap-2">
                      <div>
                        <div className="font-medium">Nombre</div>
                        <div className="truncate">{caminante.nombre_contacto_emergencia || '-'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Parentesco</div>
                        <div className="truncate">{caminante.parentesco_contacto || '-'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Celular</div>
                        <div className="truncate">{caminante.celular_contacto || '-'}</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-2">
                      <div>
                        <div className="font-medium">Nombre</div>
                        <div className="truncate">{caminante.nombre_contacto_emergencia_2 || '-'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Parentesco</div>
                        <div className="truncate">{caminante.parentesco_contacto_2 || '-'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Celular</div>
                        <div className="truncate">{caminante.celular_contacto_2 || '-'}</div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Información Médica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Medicamentos</div>
                      <div className="text-muted-foreground whitespace-pre-wrap break-words" title={caminante.medicamentos || '-'}>{caminante.medicamentos || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Restricciones alimenticias</div>
                      <div className="text-muted-foreground whitespace-pre-wrap break-words" title={caminante.restricciones_alimenticias || '-'}>{caminante.restricciones_alimenticias || '-'}</div>
                    </div>

                    <div>
                      <div className="font-medium">Tipo de sangre</div>
                      <div className="truncate">{caminante.tipo_sangre || '-'}</div>
                    </div>

                    <div>
                      <div className="font-medium">EPS</div>
                      <div className="truncate">{caminante.eps || '-'}</div>
                    </div>

                    <div>
                      <div className="font-medium">¿Ronca al dormir?</div>
                      <div>{caminante.ronca_al_dormir ? 'Sí' : 'No'}</div>
                    </div>

                    <div>
                      <div className="font-medium">Retiro sorpresa</div>
                      <div>{caminante.es_sorpresa ? 'Sí' : 'No'}</div>
                    </div>
                  </div>
                </section>

                <section className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Información Espiritual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">Parroquia</div>
                      <div className="truncate">{caminante.parroquia || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Párroco</div>
                      <div className="truncate">{caminante.parroco || '-'}</div>
                    </div>
                  </div>
                </section>

                <section className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Información Laboral</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="font-medium">Profesión</div>
                      <div className="truncate">{caminante.profesion || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Empresa</div>
                      <div className="truncate">{caminante.empresa || '-'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Cargo</div>
                      <div className="truncate">{caminante.cargo || '-'}</div>
                    </div>
                  </div>
                </section>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
