"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pill, UtensilsCrossed, Eye, Tablets } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { Servidor } from "@/lib/types"
import ServidorDetails from "@/components/servidor/servidor-details"
import { useToast } from "@/hooks/use-toast"

interface ServidorCardProps {
  servidor: Servidor
  onUpdate?: () => void
  canEdit?: boolean
}

export function ServidorCard({ servidor, onUpdate, canEdit = true }: ServidorCardProps) {
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
          <div className="flex items-center justify-between">
            <a
              href={`https://wa.me/57${servidor.celular.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {servidor.celular}
            </a>
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
              <Button variant="outline" className="w-full md:w-66 bg-transparent flex items-center justify-center gap-2">
                <Pill className="h-4 w-4" />
                {canEdit ? 'Ver/Editar Información Médica' : 'Ver Información Médica'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Información Médica - {servidor.nombre_completo}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="medicamentos" className="pb-2"><Tablets className="h-4 w-4" />Medicamentos</Label>
                  <Textarea id="medicamentos" value={medicamentos} onChange={(e) => setMedicamentos(e.target.value)} rows={4} disabled={!canEdit} />
                </div>

                <div>
                  <Label htmlFor="restricciones">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="h-4 w-4" />
                      Restricciones Alimenticias
                    </div>
                  </Label>
                  <Textarea id="restricciones" value={restricciones} onChange={(e) => setRestricciones(e.target.value)} rows={4} disabled={!canEdit} />
                </div>

                {canEdit && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                      Cancelar
                    </Button>
                    <Button onClick={updateMedicalInfo} disabled={isUpdating}>
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar Cambios
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewing} onOpenChange={setIsViewing}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-56 bg-transparent flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" />
                Ver información completa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">{servidor.nombre_completo}</DialogTitle>
              </DialogHeader>
              <ServidorDetails servidor={servidor} onImageChange={handleImageChange} canEdit={canEdit} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
