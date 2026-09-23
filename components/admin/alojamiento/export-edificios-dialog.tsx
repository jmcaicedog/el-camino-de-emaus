"use client"

import { useEffect, useState } from "react"
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
import type { EdificioConHabitaciones } from "@/lib/types"

interface ExportEdificiosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  edificios: EdificioConHabitaciones[]
  onConfirm: (edificioIds: string[]) => void
}

export function ExportEdificiosDialog({ open, onOpenChange, edificios, onConfirm }: ExportEdificiosDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      setSelected(new Set(edificios.map((e) => e.id)))
    }
  }, [open, edificios])

  const toggleEdificio = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = selected.size === edificios.length && edificios.length > 0

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(edificios.map((e) => e.id)))
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selected))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Exportar distribución de habitaciones</DialogTitle>
          <DialogDescription>Selecciona los edificios que deseas incluir en el PDF.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex items-center gap-2.5 border-b pb-2">
            <Checkbox id="export-edificio-all" checked={allSelected} onCheckedChange={toggleAll} />
            <Label htmlFor="export-edificio-all" className="cursor-pointer text-sm font-medium">
              Seleccionar todos
            </Label>
          </div>
          {edificios.map((edificio) => (
            <div key={edificio.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`export-edificio-${edificio.id}`}
                checked={selected.has(edificio.id)}
                onCheckedChange={() => toggleEdificio(edificio.id)}
              />
              <Label htmlFor={`export-edificio-${edificio.id}`} className="cursor-pointer text-sm font-normal">
                {edificio.nombre}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0} className="gap-1.5">
            <FileDown className="h-4 w-4" />
            Generar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
