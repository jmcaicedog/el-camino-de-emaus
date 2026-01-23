"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Loader2, Pill, UtensilsCrossed, Eye, Tablets } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { Servidor } from "@/lib/types"
import ServidorDetails from "@/components/servidor/servidor-details"
import { useToast } from "@/hooks/use-toast"

interface ServidorCardProps {
  servidor: Servidor
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
      // Comprimir la imagen antes de subirla
      const dataUrl = await compressImage(file)

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

  async function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          const MAX_SIZE = 1200
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          let quality = 0.85
          let dataUrl = canvas.toDataURL('image/jpeg', quality)
          const maxSizeKB = 800
          
          while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
            quality -= 0.05
            dataUrl = canvas.toDataURL('image/jpeg', quality)
          }
          
          console.log(`Imagen comprimida: ${Math.round(dataUrl.length / 1024)}KB, calidad: ${Math.round(quality * 100)}%`)
          resolve(dataUrl)
        }
        
        img.onerror = () => reject(new Error('Error al cargar la imagen'))
        img.src = e.target?.result as string
      }
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsDataURL(file)
    })
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
        </div>

        {servidor.medicamentos && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Información Médica</h3>
            <p className="text-muted-foreground">{servidor.medicamentos}</p>
          </div>
        )}

        <div className="md:col-span-2 flex flex-col items-center gap-2 mt-4">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-66 bg-transparent flex items-center justify-center gap-2">
                <Pill className="h-4 w-4" />
                Ver/Editar Información Médica
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Información Médica - {servidor.nombre_completo}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="medicamentos" className="pb-2"><Tablets className="h-4 w-4" />Medicamentos</Label>
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
              <Button variant="outline" className="w-56 bg-transparent flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" />
                Ver información completa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{servidor.nombre_completo}</DialogTitle>
              </DialogHeader>
              <ServidorDetails servidor={servidor} onImageChange={handleImageChange} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
