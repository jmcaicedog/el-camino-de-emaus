"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirmar acción",
  description = "¿Estás seguro?",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
}: Props) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsProcessing(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-sm text-muted-foreground">{description}</div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>{cancelLabel}</Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>{isProcessing ? "..." : confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
