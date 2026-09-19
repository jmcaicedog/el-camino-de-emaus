"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { FileDown } from "lucide-react"
import type { MinutoPdfColumns } from "./minuto-pdf-export"

interface ExportColumnsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (columns: MinutoPdfColumns) => void
  eventCount: number
}

const OPTIONAL_COLUMNS: { key: keyof MinutoPdfColumns; label: string }[] = [
  { key: "descripcion", label: "Descripción" },
  { key: "requerimientos", label: "Requerimientos" },
  { key: "responsables", label: "Responsables" },
]

export function ExportColumnsDialog({ open, onOpenChange, onConfirm, eventCount }: ExportColumnsDialogProps) {
  const [columns, setColumns] = useState<MinutoPdfColumns>({
    descripcion: true,
    requerimientos: true,
    responsables: true,
  })

  const toggleColumn = (key: keyof MinutoPdfColumns) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleConfirm = () => {
    onConfirm(columns)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Exportar Minuto a Minuto</DialogTitle>
          <DialogDescription>
            Se exportarán {eventCount} {eventCount === 1 ? "actividad" : "actividades"} con los filtros aplicados. Elige las columnas a incluir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex items-center gap-2.5 opacity-70">
            <Checkbox checked disabled />
            <Label className="text-sm font-normal">Franja horaria (obligatoria)</Label>
          </div>
          <div className="flex items-center gap-2.5 opacity-70">
            <Checkbox checked disabled />
            <Label className="text-sm font-normal">Nombre de la actividad (obligatoria)</Label>
          </div>
          {OPTIONAL_COLUMNS.map((col) => (
            <div key={col.key} className="flex items-center gap-2.5">
              <Checkbox
                id={`export-col-${col.key}`}
                checked={columns[col.key]}
                onCheckedChange={() => toggleColumn(col.key)}
              />
              <Label htmlFor={`export-col-${col.key}`} className="text-sm font-normal cursor-pointer">
                {col.label}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={eventCount === 0} className="gap-1.5">
            <FileDown className="h-4 w-4" />
            Generar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
