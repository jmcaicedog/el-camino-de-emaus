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
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import AvatarUploader from "@/components/ui/avatar-uploader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function CaminanteRegistrationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [sacramentos, setSacramentos] = useState<string[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleSacramentoChange = (sacramento: string, checked: boolean) => {
    if (checked) {
      setSacramentos([...sacramentos, sacramento])
    } else {
      setSacramentos(sacramentos.filter((s) => s !== sacramento))
    }
  }

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
      const response = await fetch("/api/caminantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          edad: age,
          monto_total: 450000,
          sacramentos_recibidos: sacramentos,
          es_sorpresa: data.es_sorpresa === "si",
          ronca_al_dormir: data.ronca_al_dormir === "si",
          invitador_hizo_retiro: data.invitador_hizo_retiro === "si",
          imagen: previewImage || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al registrar")
      }

      toast({
        title: "Registro exitoso",
        description: "Tu inscripción ha sido registrada correctamente.",
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
      <Alert className="bg-rose-50 border-rose-200 flex items-start justify-between">
        <AlertDescription className="text-sm text-rose-800">
          Antes de diligenciar el formulario, por favor lee las instrucciones importantes.
        </AlertDescription>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="ml-4">
              Leer instrucciones
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>¡BIENVENIDO A EMAÚS!</DialogTitle>
              <DialogDescription>Por favor lee detenidamente antes de completar el formulario</DialogDescription>
            </DialogHeader>

            <div className="mt-2 text-sm space-y-3 text-rose-800">
              <p>
                Para hacer su pre-inscripción al retiro de Emaús Cristo Rey Hombres, por favor tenga en cuenta:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Debajo de estas instrucciones se encuentra un sencillo formulario de inscripción, el cual no toma más de
                  cinco minutos diligenciarlo. Por favor completar todas las casillas del formulario. Si usted está
                  realizando el registro para otra persona, por favor indicarlo en la casilla correspondiente.
                </li>
                <li>
                  Una vez diligenciado el formulario, haz click en ENVIAR (botón al final). Si no le aparece una ventana de
                  bienvenida, verifique que todos los campos estén completos.
                </li>
                <li>
                  Le llegará un correo electrónico de emauscristoreyhombres@gmail.com dándole las instrucciones para asistir
                  al retiro y formalizar su pago; por favor leerlo, imprimirlo o guardarlo.
                </li>
                <li>
                  Una vez realizada la inscripción, lo invitamos a consignar $450.000 en la cuenta FUNDACION EMAUS PARA EL
                  DESARROLLO PROFESIONAL, SOCIAL Y COMUNITARIO, NIT 901 637364-9, Cuenta de ahorros #042863332, Banco de
                  Occidente. La consignación puede hacerse en efectivo, cheque o transferencia bancaria. También puede pagar
                  con tarjeta de crédito en este link www.opd.com.co/pagos.
                </li>
                <li>
                  Enviar el comprobante de pago con el nombre del inscrito, al correo emauscristoreyhombres@gmail.com. LA
                  INSCRIPCIÓN NO SERÁ VÁLIDA SIN EL RECIBO DE CONSIGNACIÓN ENVIADO A ESTE CORREO ELECTRÓNICO. SU CUPO NO
                  ESTARÁ ASEGURADO SI NO SE ENVÍA LA COPIA DE DICHA CONSIGNACIÓN.
                </li>
                <li>
                  LOS CUPOS SON LIMITADOS. El pago no garantiza el cupo, copia de la consignación debe ser enviada al correo
                  emauscristoreyhombres@gmail.com con los datos completos de la persona que va a realizar el retiro. Ningún
                  otro medio es válido para enviar la copia de la consignación (no es válido enviar texto o mensaje al
                  whatsapp de los servidores o coordinador del retiro).
                </li>
                <li>
                  POLÍTICA DE DEVOLUCIÓN DEL DINERO: Sólo se devolverá el dinero si la persona informa por escrito al correo
                  emauscristoreyhombres@gmail.com con al menos una semana de anticipación a la iniciación del retiro. El
                  proceso de devolución de dinero iniciará una semana después de realizado el retiro.
                </li>
              </ol>
            </div>

            <DialogFooter>
              <Button>Entendido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>¿Este retiro es una sorpresa para otra persona? *</Label>
              <RadioGroup name="es_sorpresa" defaultValue="no" required>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="si" id="sorpresa-si" />
                  <Label htmlFor="sorpresa-si" className="font-normal cursor-pointer">
                    Sí
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="sorpresa-no" />
                  <Label htmlFor="sorpresa-no" className="font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

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
            <Label htmlFor="profesion">Profesión *</Label>
            <Input id="profesion" name="profesion" required placeholder="Profesión u oficio" />
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
              <Input
                id="celular_contacto"
                name="celular_contacto"
                type="tel"
                required
                placeholder="Número de celular"
              />
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
              <Input
                id="celular_contacto_2"
                name="celular_contacto_2"
                type="tel"
                required
                placeholder="Número de celular"
              />
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

          <div>
            <Label htmlFor="condicion_especial">¿Alguna Condición Especial a Tener en Cuenta?</Label>
            <Textarea
              id="condicion_especial"
              name="condicion_especial"
              placeholder="Describe cualquier condición especial que debamos conocer (opcional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Espiritual</CardTitle>
          <CardDescription>Esta información es opcional</CardDescription>
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

          <div className="space-y-3">
            <Label>Sacramentos Recibidos</Label>
            <div className="space-y-2">
                  {[
                { id: "bautismo", label: "Bautismo" },
                { id: "confesion", label: "Confesión" },
                { id: "primera_comunion", label: "Primera Comunión" },
                { id: "confirmacion", label: "Confirmación" },
                { id: "matrimonio", label: "Matrimonio" },
                { id: "orden_sacerdotal", label: "Orden Sacerdotal" },
              ].map((sacramento) => (
                <div key={sacramento.id} className="flex items-center gap-2">
                  <Checkbox
                    id={sacramento.id}
                    checked={sacramentos.includes(sacramento.id)}
                    onCheckedChange={(checked: boolean | 'indeterminate') => handleSacramentoChange(sacramento.id, checked === true)}
                  />
                  <Label htmlFor={sacramento.id} className="font-normal cursor-pointer">
                    {sacramento.label}
                  </Label>
                </div>
              ))}
            </div>

              <div>
                <Label htmlFor="imagen">Foto personal (opcional)</Label>
                <div className="mt-2">
                  <AvatarUploader
                    id="caminante-imagen"
                    name={undefined}
                    preview={previewImage}
                    onChange={(file, dataUrl) => setPreviewImage(dataUrl ?? null)}
                  />
                </div>
              </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Invitación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quien_invito">¿Quién te invitó al retiro?</Label>
            <Input id="quien_invito" name="quien_invito" placeholder="Nombre de quien te invitó" />
          </div>

          <div className="space-y-2">
            <Label>¿La persona que te invitó ya hizo el retiro?</Label>
            <RadioGroup name="invitador_hizo_retiro">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="si" id="invitador-si" />
                <Label htmlFor="invitador-si" className="font-normal cursor-pointer">
                  Sí
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="invitador-no" />
                <Label htmlFor="invitador-no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no_se" id="invitador-no-se" />
                <Label htmlFor="invitador-no-se" className="font-normal cursor-pointer">
                  No sé
                </Label>
              </div>
            </RadioGroup>
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
