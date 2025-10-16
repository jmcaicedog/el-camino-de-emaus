"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function ServidorRegistrationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    // Calculate age from birth date
    const birthDate = new Date(data.fecha_nacimiento as string)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    try {
      // Normalize form values: convert radio values like "si"/"no" to booleans,
      // and parse numeric fields to numbers before sending to the API.
      const payload = {
        ...data,
        edad: age,
        monto_total: 150000,
        retiros_anteriores: Number.parseInt((data.retiros_anteriores as string) || "0") || 0,
        // Convert known boolean-like radio fields
        ronca_al_dormir: (data.ronca_al_dormir as string) === "si",
        imagen: previewImage || null,
      }

      const response = await fetch("/api/servidores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al registrar")
      }

      toast({
        title: "Registro exitoso",
        description: "Tu inscripción como servidor ha sido registrada correctamente.",
      })

      router.push("/registro/exito")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="nombre_completo">Nombre Completo *</Label>
              <Input id="nombre_completo" name="nombre_completo" required placeholder="Nombre completo" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cedula">Cédula *</Label>
                <Input id="cedula" name="cedula" required placeholder="Número de cédula" />
              </div>
              <div>
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="celular">Celular *</Label>
                <Input id="celular" name="celular" type="tel" required placeholder="Número de celular" />
              </div>
              <div>
                <Label htmlFor="correo">Correo Electrónico *</Label>
                <Input id="correo" name="correo" type="email" required placeholder="correo@ejemplo.com" />
              </div>
            </div>

            <div>
              <Label htmlFor="direccion">Dirección *</Label>
              <Input id="direccion" name="direccion" required placeholder="Dirección completa" />
            </div>

            <div>
              <Label htmlFor="imagen">Foto personal (opcional)</Label>
              <input
                id="imagen"
                name="imagen_file"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.currentTarget.files?.[0]
                  if (!file) return setPreviewImage(null)
                  const reader = new FileReader()
                  reader.onload = () => setPreviewImage(reader.result as string)
                  reader.readAsDataURL(file)
                }}
              />
              {previewImage && (
                <div className="mt-2 w-24 h-24 rounded-full overflow-hidden">
                  <img src={previewImage} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input id="ciudad" name="ciudad" required placeholder="Ciudad" />
              </div>
              <div>
                <Label htmlFor="estado_civil">Estado Civil *</Label>
                <Select name="estado_civil" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soltero">Soltero</SelectItem>
                    <SelectItem value="casado">Casado</SelectItem>
                    <SelectItem value="union_libre">Unión Libre</SelectItem>
                    <SelectItem value="divorciado">Divorciado</SelectItem>
                    <SelectItem value="viudo">Viudo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profesión, empresa y cargo han sido movidos a Información Laboral */}
            <div>
              <Label htmlFor="talla_camisa">Talla de Camisa *</Label>
              <Select name="talla_camisa" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu talla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Laboral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="profesion">Profesión u oficio</Label>
            <Input id="profesion" name="profesion" placeholder="Profesión u oficio" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Input id="empresa" name="empresa" placeholder="Nombre de la empresa" />
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" name="cargo" placeholder="Cargo actual" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contactos de Emergencia</CardTitle>
          <CardDescription>Por favor proporciona dos contactos de emergencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Contacto de Emergencia #1</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre_contacto_emergencia">Nombre Completo *</Label>
                <Input
                  id="nombre_contacto_emergencia"
                  name="nombre_contacto_emergencia"
                  required
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <Label htmlFor="parentesco_contacto">Parentesco *</Label>
                <Input
                  id="parentesco_contacto"
                  name="parentesco_contacto"
                  required
                  placeholder="Ej: Esposa, Madre, Hermano"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="celular_contacto">Celular de Contacto *</Label>
              <Input id="celular_contacto" name="celular_contacto" type="tel" required placeholder="Número de celular" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Contacto de Emergencia #2</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre_contacto_emergencia_2">Nombre Completo *</Label>
                <Input
                  id="nombre_contacto_emergencia_2"
                  name="nombre_contacto_emergencia_2"
                  required
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <Label htmlFor="parentesco_contacto_2">Parentesco *</Label>
                <Input
                  id="parentesco_contacto_2"
                  name="parentesco_contacto_2"
                  required
                  placeholder="Ej: Padre, Hermana, Amigo"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="celular_contacto_2">Celular de Contacto *</Label>
              <Input id="celular_contacto_2" name="celular_contacto_2" type="tel" required placeholder="Número de celular" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Médica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eps">EPS *</Label>
              <Input id="eps" name="eps" required placeholder="Nombre de la EPS" />
            </div>
            <div>
              <Label htmlFor="tipo_sangre">Tipo de Sangre *</Label>
              <Select name="tipo_sangre" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="medicamentos">Medicamentos</Label>
            <Textarea
              id="medicamentos"
              name="medicamentos"
              placeholder="Lista de medicamentos que toma regularmente (opcional)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="restricciones_alimenticias">Restricciones Alimenticias</Label>
            <Textarea
              id="restricciones_alimenticias"
              name="restricciones_alimenticias"
              placeholder="Alergias o restricciones alimenticias (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>¿Ronca al dormir? *</Label>
            <RadioGroup name="ronca_al_dormir" defaultValue="no" required>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="si" id="ronca-si" />
                <Label htmlFor="ronca-si" className="font-normal cursor-pointer">
                  Sí
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="ronca-no" />
                <Label htmlFor="ronca-no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Espiritual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="parroquia">Parroquia</Label>
            <Input id="parroquia" name="parroquia" placeholder="Nombre de la parroquia" />
          </div>
          <div>
            <Label htmlFor="parroco">Párroco</Label>
            <Input id="parroco" name="parroco" placeholder="Nombre del párroco" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experiencia como Servidor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="retiros_anteriores">Número de Retiros Anteriores *</Label>
            <Input
              id="retiros_anteriores"
              name="retiros_anteriores"
              type="number"
              min="0"
              defaultValue="0"
              required
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="experiencia_servicio">Experiencia en Servicio</Label>
            <Textarea
              id="experiencia_servicio"
              name="experiencia_servicio"
              placeholder="Describe tu experiencia previa en servicio o ministerios (opcional)"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Inscripción
        </Button>
      </div>
    </form>
  )
}
