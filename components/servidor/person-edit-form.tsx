"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Caminante, Servidor } from "@/lib/types"

type Person = Caminante | Servidor

interface PersonEditFormProps {
  person: Person
  kind: "caminante" | "servidor"
  onSave: (changes: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}

const commonFields = [
  ["nombre_completo", "Nombre completo"],
  ["cedula", "Cédula"],
  ["fecha_nacimiento", "Fecha de nacimiento", "date"],
  ["celular", "Celular"],
  ["correo", "Correo", "email"],
  ["direccion", "Dirección"],
  ["ciudad", "Ciudad"],
  ["estado_civil", "Estado civil"],
  ["profesion", "Profesión"],
  ["empresa", "Empresa"],
  ["cargo", "Cargo"],
  ["nombre_contacto_emergencia", "Contacto de emergencia"],
  ["parentesco_contacto", "Parentesco del contacto"],
  ["celular_contacto", "Celular del contacto"],
  ["nombre_contacto_emergencia_2", "Segundo contacto de emergencia"],
  ["parentesco_contacto_2", "Parentesco del segundo contacto"],
  ["celular_contacto_2", "Celular del segundo contacto"],
  ["condicion_especial", "Condición especial"],
  ["eps", "EPS"],
  ["tipo_sangre", "Tipo de sangre"],
  ["parroquia", "Parroquia"],
  ["parroco", "Párroco"],
] as const

const textAreas = new Set(["condicion_especial", "medicamentos", "restricciones_alimenticias", "observaciones", "experiencia_servicio"])

export function PersonEditForm({ person, kind, onSave, onCancel }: PersonEditFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({ ...person })
  const [isSaving, setIsSaving] = useState(false)
  const shirtColors = Array.isArray(values.colores_camisa) ? values.colores_camisa.map(String) : []

  const setValue = (field: string, value: unknown) => setValues((current) => ({ ...current, [field]: value }))
  const toggleShirtColor = (color: string, checked: boolean) => {
    setValue("colores_camisa", checked ? [...shirtColors, color] : shirtColors.filter((current) => current !== color))
  }
  const renderField = (field: string, label: string, type = "text") => (
    <div key={field} className="space-y-1">
      <Label htmlFor={`edit-${kind}-${field}`}>{label}</Label>
      {textAreas.has(field) ? (
        <Textarea id={`edit-${kind}-${field}`} value={String(values[field] ?? "")} onChange={(event) => setValue(field, event.target.value)} rows={3} />
      ) : (
        <Input id={`edit-${kind}-${field}`} type={type} value={String(values[field] ?? "")} onChange={(event) => setValue(field, event.target.value)} />
      )}
    </div>
  )

  const save = async () => {
    setIsSaving(true)
    try {
      const changes: Record<string, unknown> = {}
      for (const [field] of commonFields) {
        if (values[field] !== undefined) changes[field] = values[field]
      }
      const numericFields = kind === "servidor" ? ["edad", "retiros_anteriores"] : ["edad"]
      for (const field of numericFields) changes[field] = Number(values[field] ?? 0)
      await onSave({
        ...changes,
        medicamentos: values.medicamentos ?? "",
        restricciones_alimenticias: values.restricciones_alimenticias ?? "",
        condicion_especial: values.condicion_especial ?? "",
        ronca_al_dormir: Boolean(values.ronca_al_dormir),
        ...(kind === "caminante" ? {
          observaciones: values.observaciones ?? "",
          talla_camisa: values.talla_camisa ?? "",
          quien_invito: values.quien_invito ?? "",
          invitador_hizo_retiro: values.invitador_hizo_retiro === true,
          sacramentos_recibidos: Array.isArray(values.sacramentos_recibidos)
            ? values.sacramentos_recibidos
            : String(values.sacramentos_recibidos ?? "").split(",").map((value) => value.trim()).filter(Boolean),
        } : {
          talla_camisa: values.talla_camisa ?? "",
          colores_camisa: shirtColors,
          experiencia_servicio: values.experiencia_servicio ?? "",
        }),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {commonFields.map(([field, label, type]) => renderField(field, label, type))}
        {renderField("edad", "Edad", "number")}
        {kind === "servidor" ? (
          <div className="space-y-1">
            <Label htmlFor="edit-servidor-talla_camisa">Talla de camisa</Label>
            <Select value={String(values.talla_camisa || "none")} onValueChange={(value) => setValue("talla_camisa", value === "none" ? "" : value)}>
              <SelectTrigger id="edit-servidor-talla_camisa">
                <SelectValue placeholder="Selecciona tu talla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin talla</SelectItem>
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : renderField("talla_camisa", "Talla de camisa")}
        {kind === "servidor" && (
          <div className="space-y-2 md:col-span-2">
            <Label>Colores de camisa necesarios</Label>
            <div className="flex flex-wrap gap-4">
              {['Roja', 'Azul', 'Blanca'].map((color) => (
                <label key={color} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={shirtColors.includes(color)} onCheckedChange={(checked) => toggleShirtColor(color, checked === true)} />
                  {color}
                </label>
              ))}
            </div>
          </div>
        )}
        {kind === "servidor" && renderField("retiros_anteriores", "Retiros anteriores", "number")}
        {kind === "servidor" && renderField("experiencia_servicio", "Experiencia en servicio")}
        {kind === "caminante" && renderField("quien_invito", "¿Quién lo invitó?")}
        {kind === "caminante" && renderField("sacramentos_recibidos", "Sacramentos recibidos")}
        {renderField("medicamentos", "Medicamentos")}
        {renderField("restricciones_alimenticias", "Restricciones alimenticias")}
        {kind === "caminante" && renderField("observaciones", "Observaciones")}
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(values.ronca_al_dormir)} onChange={(event) => setValue("ronca_al_dormir", event.target.checked)} />
          Ronca al dormir
        </label>
        {kind === "caminante" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.invitador_hizo_retiro === true} onChange={(event) => setValue("invitador_hizo_retiro", event.target.checked)} />
            El invitador ya hizo el retiro
          </label>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button onClick={save} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}