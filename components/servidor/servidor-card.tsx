"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Phone, MapPin, Loader2 } from "lucide-react"
import type { Servidor } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ServidorCardProps {
  servidor: Servidor
  onClose?: () => void
}

export function ServidorCard({ servidor }: ServidorCardProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [medicamentos, setMedicamentos] = useState(servidor.medicamentos || "")
  const [isUpdating, setIsUpdating] = useState(false)

  const updateMedicalInfo = async () => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/servidores/${servidor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicamentos }),
      })

      if (!res.ok) throw new Error("Error al actualizar")

      toast({ title: "Actualizado", description: "Información médica actualizada" })
      setIsEditing(false)
    } catch (e) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{servidor.nombre_completo}</CardTitle>
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
          <h3 className="font-semibold mb-2">Contacto de Emergencia</h3>
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
                <span className="font-medium">Contacto 2:</span>
                <div className="text-muted-foreground">{servidor.nombre_contacto_emergencia_2} ({servidor.parentesco_contacto_2}) - {servidor.celular_contacto_2}</div>
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

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isUpdating}>
            Editar Médicos
          </Button>
        </div>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <span />
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                  Cancelar
                </Button>
                <Button onClick={updateMedicalInfo} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
