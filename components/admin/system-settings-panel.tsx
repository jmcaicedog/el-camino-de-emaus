"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { Settings2, Upload, AlertTriangle, CalendarClock, Users, DollarSign } from "lucide-react"
import { MAX_CAMINANTES } from "@/lib/caminantes-capacity"

export function SystemSettingsPanel() {
  const { toast } = useToast()
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [confirmHardResetOpen, setConfirmHardResetOpen] = useState(false)

  const [retiroDateTime, setRetiroDateTime] = useState("2026-04-10T16:00")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [mesasCount, setMesasCount] = useState(12)
  const [caminantesPorMesa, setCaminantesPorMesa] = useState(7)
  const [cupoCaminantes, setCupoCaminantes] = useState(MAX_CAMINANTES)
  const [costoServidores, setCostoServidores] = useState(400000)
  const [costoCaminantes, setCostoCaminantes] = useState(490000)
  const [countdownEnabled, setCountdownEnabled] = useState(true)
  const [caminanteFormEnabled, setCaminanteFormEnabled] = useState(true)

  const toLocalDateTimeInput = (value?: string | null) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""

    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    const h = String(date.getHours()).padStart(2, "0")
    const min = String(date.getMinutes()).padStart(2, "0")
    return `${y}-${m}-${d}T${h}:${min}`
  }

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/retiro-settings", { cache: "no-store" })
      if (!response.ok) throw new Error("No fue posible cargar la configuración")

      const settings = await response.json()
      setRetiroDateTime(toLocalDateTimeInput(settings.retiro_datetime))
      setLogoUrl(settings.logo_url || null)
      setMesasCount(Number(settings.mesas_count) || 12)
      setCaminantesPorMesa(Number(settings.caminantes_por_mesa) || 7)
      setCupoCaminantes(Number(settings.max_caminantes) || MAX_CAMINANTES)
      setCostoServidores(Number(settings.costo_servidor) || 400000)
      setCostoCaminantes(Number(settings.costo_caminante) || 490000)
      setCountdownEnabled(Boolean(settings.countdown_enabled))
      setCaminanteFormEnabled(
        typeof settings.caminante_form_enabled === "boolean" ? settings.caminante_form_enabled : true,
      )
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible cargar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void loadSettings()
    }
  }, [open])

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(logoFile)
    setLogoPreview(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [logoFile])

  const fileToDataUrl = async (file: File) =>
    await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error("No fue posible leer el logo"))
      reader.readAsDataURL(file)
    })

  const openLogoPicker = () => {
    logoInputRef.current?.click()
  }

  const clearSelectedLogoFile = () => {
    setLogoFile(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ""
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      let nextLogoValue = logoUrl
      if (logoFile) {
        nextLogoValue = await fileToDataUrl(logoFile)
      }

      const response = await fetch("/api/retiro-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retiro_datetime: new Date(retiroDateTime).toISOString(),
          logo_url: nextLogoValue,
          mesas_count: mesasCount,
          caminantes_por_mesa: caminantesPorMesa,
          max_caminantes: cupoCaminantes,
          costo_servidor: costoServidores,
          costo_caminante: costoCaminantes,
          countdown_enabled: countdownEnabled,
          caminante_form_enabled: caminanteFormEnabled,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || "No fue posible guardar la configuración")

      setLogoUrl(result.logo_url || null)
      setLogoFile(null)
      toast({ title: "Configuración guardada", description: "Los cambios fueron aplicados correctamente." })
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const hardReset = async () => {
    setIsResetting(true)
    try {
      const response = await fetch("/api/retiro-settings/hard-reset", { method: "POST" })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || "No fue posible ejecutar hard reset")

      toast({ title: "Hard reset ejecutado", description: "Se eliminaron los registros de caminantes y servidores." })
      setConfirmHardResetOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible ejecutar hard reset",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir configuración del sistema" title="Configuración del sistema">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[94vw] max-w-[94vw] sm:max-w-3xl md:max-w-3xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configuración General del Retiro</DialogTitle>
          <DialogDescription>
            Panel de configuración global del retiro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Datos Generales</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retiro-fecha">Fecha del retiro (con hora)</Label>
                <Input
                  id="retiro-fecha"
                  type="datetime-local"
                  value={retiroDateTime}
                  onChange={(e) => setRetiroDateTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retiro-logo">Logo del retiro</Label>
                <Input
                  ref={logoInputRef}
                  id="retiro-logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={openLogoPicker} disabled={isLoading}>
                        <Upload className="h-4 w-4" />
                        Seleccionar archivo
                      </Button>
                      {logoFile && (
                        <Button type="button" variant="ghost" onClick={clearSelectedLogoFile} disabled={isLoading}>
                          Quitar
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {logoFile ? logoFile.name : logoUrl ? "Usando logo guardado actualmente" : "Ningún archivo seleccionado"}
                    </p>
                  </div>

                  <div className="h-14 w-14 shrink-0 rounded-md border bg-secondary/40 overflow-hidden flex items-center justify-center">
                    {logoPreview || logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview || logoUrl || ""} alt="Vista previa de logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Sin logo</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Capacidad y Estructura</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mesas-cantidad">Cantidad de mesas</Label>
                <Input
                  id="mesas-cantidad"
                  type="number"
                  min={1}
                  value={mesasCount}
                  onChange={(e) => setMesasCount(Number(e.target.value) || 0)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caminantes-por-mesa">Caminantes por mesa</Label>
                <Input
                  id="caminantes-por-mesa"
                  type="number"
                  min={1}
                  value={caminantesPorMesa}
                  onChange={(e) => setCaminantesPorMesa(Number(e.target.value) || 0)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cupo-caminantes">Cantidad de caminantes (cupo)</Label>
                <Input
                  id="cupo-caminantes"
                  type="number"
                  min={1}
                  value={cupoCaminantes}
                  onChange={(e) => setCupoCaminantes(Number(e.target.value) || 0)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Costos</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costo-servidor">Costo del retiro para servidores</Label>
                <Input
                  id="costo-servidor"
                  type="number"
                  min={0}
                  step={1000}
                  value={costoServidores}
                  onChange={(e) => setCostoServidores(Number(e.target.value) || 0)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo-caminante">Costo del retiro para caminantes</Label>
                <Input
                  id="costo-caminante"
                  type="number"
                  min={0}
                  step={1000}
                  value={costoCaminantes}
                  onChange={(e) => setCostoCaminantes(Number(e.target.value) || 0)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold">Comportamiento de la Interfaz</h3>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Activar conteo regresivo</p>
                <p className="text-sm text-muted-foreground">Mostrar u ocultar el contador en inicio y login.</p>
              </div>
              <Checkbox checked={countdownEnabled} onCheckedChange={(v) => setCountdownEnabled(v === true)} disabled={isLoading} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Habilitar registro/lista de espera de caminantes</p>
                <p className="text-sm text-muted-foreground">
                  Activa o desactiva el botón del inicio y el formulario público de caminantes.
                </p>
              </div>
              <Checkbox
                checked={caminanteFormEnabled}
                onCheckedChange={(v) => setCaminanteFormEnabled(v === true)}
                disabled={isLoading}
              />
            </div>
          </section>

          <section className="rounded-lg border border-destructive/40 p-4 space-y-3 bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="font-semibold">Zona Crítica</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Hard reset para limpiar completamente los listados de caminantes y servidores.
            </p>
            <Button type="button" variant="destructive" onClick={() => setConfirmHardResetOpen(true)} disabled={isResetting || isLoading}>
              Hard reset
            </Button>
          </section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button type="button" onClick={saveSettings} disabled={isSaving || isLoading}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={confirmHardResetOpen}
      onOpenChange={setConfirmHardResetOpen}
      title="Confirmar hard reset"
      description="Esta acción eliminará TODOS los caminantes y servidores registrados. No se puede deshacer."
      confirmLabel={isResetting ? "Procesando..." : "Ejecutar hard reset"}
      cancelLabel="Cancelar"
      onConfirm={hardReset}
    />
    </>
  )
}
