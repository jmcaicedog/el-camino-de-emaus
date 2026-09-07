"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, X, Plus, Search, MapPin, Users, User, Shield, Check, ClipboardList, Sparkles, ListChecks } from "lucide-react"
import { MINUTO_COLORS, getColorConfig } from "./minuto-colors"
import { getRetiroDays, type RetiroDayInfo, formatTime24, getDurationLabel } from "./minuto-helpers"
import type { MinutoEvento, Servidor, Equipo, TipoResponsable, TipoEquipo } from "@/lib/types"

interface SelectedResponsable {
  tipo_responsable: TipoResponsable
  servidor_id?: string
  equipo_id?: string
  nombre: string
}

interface EventoModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (evento: MinutoEvento) => void
  eventoParaEditar?: MinutoEvento | null
  retiroDays: RetiroDayInfo[]
  defaultDayIndex?: number
  servidores: Servidor[]
  equipos: Equipo[]
}

export function EventoModal({
  isOpen,
  onClose,
  onSaved,
  eventoParaEditar,
  retiroDays,
  defaultDayIndex = 0,
  servidores,
  equipos,
}: EventoModalProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [requerimientos, setRequerimientos] = useState("")
  const [color, setColor] = useState("sky")
  const [selectedDayIso, setSelectedDayIso] = useState<string>("")
  const [horaInicio, setHoraInicio] = useState("20:00")
  const [horaFin, setHoraFin] = useState("20:45")
  const [responsables, setResponsables] = useState<SelectedResponsable[]>([])

  // Buscadores internos
  const [servidorSearch, setServidorSearch] = useState("")
  const [equipoSearch, setEquipoSearch] = useState("")

  useEffect(() => {
    if (!isOpen) return

    if (eventoParaEditar) {
      setTitulo(eventoParaEditar.titulo)
      setDescripcion(eventoParaEditar.descripcion || "")
      setUbicacion(eventoParaEditar.ubicacion || "")
      setRequerimientos(eventoParaEditar.requerimientos || "")
      setColor(eventoParaEditar.color || "sky")

      const startD = new Date(eventoParaEditar.fecha_inicio)
      const endD = new Date(eventoParaEditar.fecha_fin)

      const year = startD.getFullYear()
      const month = String(startD.getMonth() + 1).padStart(2, "0")
      const day = String(startD.getDate()).padStart(2, "0")
      setSelectedDayIso(`${year}-${month}-${day}`)

      setHoraInicio(formatTime24(eventoParaEditar.fecha_inicio))
      setHoraFin(formatTime24(eventoParaEditar.fecha_fin))

      const currentResp: SelectedResponsable[] = (eventoParaEditar.responsables || []).map((r) => {
        if (r.tipo_responsable === "todos") {
          return {
            tipo_responsable: "todos",
            nombre: "Todos los Servidores",
          }
        }
        if (r.tipo_responsable === "servidor") {
          return {
            tipo_responsable: "servidor",
            servidor_id: r.servidor_id || r.servidor?.id,
            nombre: r.servidor?.nombre_completo || "Servidor",
          }
        }
        return {
          tipo_responsable: "equipo",
          equipo_id: r.equipo_id || r.equipo?.id,
          nombre: r.equipo?.nombre || "Equipo",
        }
      })
      setResponsables(currentResp)
    } else {
      const defaultDay = retiroDays[defaultDayIndex] || retiroDays[0]
      const dayIso = defaultDay ? defaultDay.isoDate : ""
      setSelectedDayIso(dayIso)

      setTitulo("")
      setDescripcion("")
      setUbicacion("")
      setRequerimientos("")
      setColor("sky")
      if (defaultDay?.key === "viernes") {
        setHoraInicio("08:00")
        setHoraFin("09:00")
      } else if (defaultDay?.key === "domingo") {
        setHoraInicio("08:00")
        setHoraFin("09:00")
      } else {
        setHoraInicio("08:00")
        setHoraFin("09:00")
      }
      setResponsables([])
    }
    setServidorSearch("")
    setEquipoSearch("")
  }, [isOpen, eventoParaEditar, retiroDays, defaultDayIndex])

  // Calcular duración estimada
  const fakeStart = `${selectedDayIso || "2026-04-10"}T${horaInicio || "00:00"}:00`
  const fakeEnd = `${selectedDayIso || "2026-04-10"}T${horaFin || "00:00"}:00`
  const durationLabel = getDurationLabel(fakeStart, fakeEnd)

  const handleAddTodosServidores = () => {
    if (responsables.some((r) => r.tipo_responsable === "todos")) {
      return
    }
    setResponsables((prev) => [
      ...prev,
      {
        tipo_responsable: "todos",
        nombre: "Todos los Servidores",
      },
    ])
  }

  const handleAddServidor = (serv: Servidor) => {
    if (responsables.some((r) => r.tipo_responsable === "servidor" && r.servidor_id === serv.id)) {
      return
    }
    setResponsables((prev) => [
      ...prev,
      {
        tipo_responsable: "servidor",
        servidor_id: serv.id,
        nombre: serv.nombre_completo,
      },
    ])
  }

  const handleAddEquipo = (eq: Equipo) => {
    if (responsables.some((r) => r.tipo_responsable === "equipo" && r.equipo_id === eq.id)) {
      return
    }
    setResponsables((prev) => [
      ...prev,
      {
        tipo_responsable: "equipo",
        equipo_id: eq.id,
        nombre: eq.nombre,
      },
    ])
  }

  const handleRemoveResponsable = (index: number) => {
    setResponsables((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor escribe el nombre o título del evento",
        variant: "destructive",
      })
      return
    }

    if (!selectedDayIso) {
      toast({
        title: "Día requerido",
        description: "Selecciona el día del retiro para este evento",
        variant: "destructive",
      })
      return
    }

    if (!horaInicio || !horaFin) {
      toast({
        title: "Horario requerido",
        description: "Ingresa la hora de inicio y de fin",
        variant: "destructive",
      })
      return
    }

    const startIso = `${selectedDayIso}T${horaInicio}:00-05:00`
    const endIso = `${selectedDayIso}T${horaFin}:00-05:00`

    const startDate = new Date(startIso)
    const endDate = new Date(endIso)

    if (endDate < startDate) {
      toast({
        title: "Horario inválido",
        description: "La hora de fin no puede ser anterior a la hora de inicio",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        ubicacion: ubicacion.trim() || null,
        requerimientos: requerimientos.trim() || null,
        fecha_inicio: startDate.toISOString(),
        fecha_fin: endDate.toISOString(),
        color,
        responsables: responsables.map((r) => ({
          tipo_responsable: r.tipo_responsable,
          servidor_id: r.servidor_id || null,
          equipo_id: r.equipo_id || null,
        })),
      }

      const url = eventoParaEditar
        ? `/api/minuto-a-minuto/${eventoParaEditar.id}`
        : "/api/minuto-a-minuto"
      const method = eventoParaEditar ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al guardar el evento")
      }

      toast({
        title: "Éxito",
        description: eventoParaEditar ? "Evento actualizado correctamente" : "Evento creado correctamente",
      })

      onSaved(data)
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el evento",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredServidores = servidores.filter((s) => {
    const q = servidorSearch.toLowerCase().trim()
    if (!q) return true
    return (
      s.nombre_completo.toLowerCase().includes(q) ||
      (s.equipos && s.equipos.some((e) => e.toLowerCase().includes(q)))
    )
  })

  // Separar equipos según su tipo: "equipo" vs "actividad"
  const equiposGrupo = equipos.filter((e) => e.tipo === "equipo")
  const actividadesGrupo = equipos.filter((e) => e.tipo === "actividad")

  const filteredEquiposGrupo = equiposGrupo.filter((e) => {
    const q = equipoSearch.toLowerCase().trim()
    if (!q) return true
    return e.nombre.toLowerCase().includes(q) || (e.descripcion && e.descripcion.toLowerCase().includes(q))
  })

  const filteredActividadesGrupo = actividadesGrupo.filter((e) => {
    const q = equipoSearch.toLowerCase().trim()
    if (!q) return true
    return e.nombre.toLowerCase().includes(q) || (e.descripcion && e.descripcion.toLowerCase().includes(q))
  })

  const isTodosSelected = responsables.some((r) => r.tipo_responsable === "todos")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            {eventoParaEditar ? "Editar Actividad" : "Nueva Actividad en Agenda"}
          </DialogTitle>
          <DialogDescription>
            Configura el horario, color y responsables de la actividad en el minuto a minuto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo" className="text-sm font-semibold">
              Nombre de la actividad *
            </Label>
            <Input
              id="titulo"
              placeholder="Ej. Desayuno, Charla 1, Dinámica del perdón..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="text-base"
              required
            />
          </div>

          {/* Ubicación y Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ubicacion" className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Ubicación / Lugar
              </Label>
              <Input
                id="ubicacion"
                placeholder="Ej. Capilla, Salón Principal, Comedor..."
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Tono de color</Label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {Object.values(MINUTO_COLORS).map((c) => {
                  const isSelected = color === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${c.accent} ${
                        isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-80 hover:opacity-100"
                      }`}
                      title={c.label}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Fecha y Horario */}
          <div className="p-3.5 bg-muted/40 rounded-lg border space-y-3">
            <Label className="text-sm font-semibold">Día y Horario del Retiro</Label>
            
            {/* Selector de día */}
            <div className="grid grid-cols-3 gap-2">
              {retiroDays.map((d) => {
                const isSelected = selectedDayIso === d.isoDate
                return (
                  <button
                    key={d.isoDate}
                    type="button"
                    onClick={() => setSelectedDayIso(d.isoDate)}
                    className={`py-2 px-2.5 rounded-md text-xs md:text-sm font-medium border text-center transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-[11px] opacity-85 truncate">{d.shortLabel}</div>
                  </button>
                )
              })}
            </div>

            {/* Inputs de Horas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end pt-1">
              <div className="space-y-1">
                <Label htmlFor="horaInicio" className="text-xs text-muted-foreground">
                  Hora de inicio
                </Label>
                <Input
                  id="horaInicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="bg-background font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="horaFin" className="text-xs text-muted-foreground">
                  Hora de finalización
                </Label>
                <Input
                  id="horaFin"
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="bg-background font-mono"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-center sm:justify-end pb-1.5 text-xs text-muted-foreground">
                <span>Duración: <strong className="text-foreground">{durationLabel}</strong></span>
              </div>
            </div>
          </div>

          {/* Descripción y Requerimientos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-sm font-semibold">
                Detalles / Instrucciones (opcional)
              </Label>
              <Textarea
                id="descripcion"
                placeholder="Instrucciones específicas o notas sobre la actividad..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requerimientos" className="text-sm font-semibold flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
                Requerimientos / Materiales (opcional)
              </Label>
              <Textarea
                id="requerimientos"
                placeholder="Ej. Micrófono, velas, 65 cartas, proyector, refrigerios..."
                value={requerimientos}
                onChange={(e) => setRequerimientos(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Responsables (Servidores o Equipos) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                Responsables Asignados ({responsables.length})
              </Label>
              <span className="text-xs text-muted-foreground">
                Servidores o Equipos completos
              </span>
            </div>

            {/* Chips de responsables seleccionados */}
            {responsables.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/30 rounded-md border min-h-[42px]">
                {responsables.map((resp, idx) => (
                  <Badge
                    key={`${resp.tipo_responsable}-${resp.servidor_id || resp.equipo_id || "todos"}-${idx}`}
                    variant="secondary"
                    className={`flex items-center gap-1.5 py-1 px-2.5 text-xs border shadow-xs ${
                      resp.tipo_responsable === "todos"
                        ? "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200"
                        : "bg-background"
                    }`}
                  >
                    {resp.tipo_responsable === "todos" ? (
                      <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    ) : resp.tipo_responsable === "equipo" ? (
                      <Users className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <User className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span className="font-semibold">{resp.nombre}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsable(idx)}
                      className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-md border border-dashed">
                Sin responsables asignados aún. Selecciona servidores o equipos abajo.
              </p>
            )}

            {/* Accion rapida: Asignar Todos los Servidores */}
            <div className="flex items-center justify-between p-2 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-md">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-purple-900 dark:text-purple-200">Asignar a todos los servidores</span>
                  <span className="hidden sm:inline text-purple-700 dark:text-purple-300 ml-1.5">
                    (aparecerá en la agenda de todo el equipo de servicio)
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isTodosSelected ? "secondary" : "outline"}
                onClick={handleAddTodosServidores}
                disabled={isTodosSelected}
                className={`h-7 text-xs gap-1 flex-shrink-0 ${
                  isTodosSelected
                    ? "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200 cursor-not-allowed"
                    : "border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950 text-purple-900 dark:text-purple-200"
                }`}
              >
                {isTodosSelected ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-purple-700 dark:text-purple-300" />
                    <span>Asignado</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Asignar Todos</span>
                  </>
                )}
              </Button>
            </div>

            {/* Tabs para buscar y añadir Equipos, Actividades o Servidores */}
            <Tabs defaultValue="equipos" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="equipos" className="text-xs gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>Equipos ({filteredEquiposGrupo.length})</span>
                </TabsTrigger>
                <TabsTrigger value="actividades" className="text-xs gap-1">
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Actividades ({filteredActividadesGrupo.length})</span>
                </TabsTrigger>
                <TabsTrigger value="servidores" className="text-xs gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>Servidores ({filteredServidores.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Contenido Equipos (Tipo 'equipo') */}
              <TabsContent value="equipos" className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar equipo de servicio..."
                    value={equipoSearch}
                    onChange={(e) => setEquipoSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md p-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {filteredEquiposGrupo.map((eq) => {
                    const isAdded = responsables.some(
                      (r) => r.tipo_responsable === "equipo" && r.equipo_id === eq.id
                    )
                    return (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleAddEquipo(eq)}
                        disabled={isAdded}
                        className={`text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          isAdded
                            ? "bg-muted/60 text-muted-foreground cursor-not-allowed opacity-60"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <span className="truncate font-medium block">{eq.nombre}</span>
                          {eq.descripcion && (
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {eq.descripcion}
                            </span>
                          )}
                        </div>
                        {isAdded ? (
                          <Check className="h-3 w-3 text-emerald-600 flex-shrink-0 ml-1" />
                        ) : (
                          <Plus className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-1" />
                        )}
                      </button>
                    )
                  })}
                  {filteredEquiposGrupo.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2 col-span-2 text-center">
                      No se encontraron equipos
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Contenido Actividades (Tipo 'actividad') */}
              <TabsContent value="actividades" className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar grupo de actividad/dinámica..."
                    value={equipoSearch}
                    onChange={(e) => setEquipoSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md p-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {filteredActividadesGrupo.map((eq) => {
                    const isAdded = responsables.some(
                      (r) => r.tipo_responsable === "equipo" && r.equipo_id === eq.id
                    )
                    return (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleAddEquipo(eq)}
                        disabled={isAdded}
                        className={`text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          isAdded
                            ? "bg-muted/60 text-muted-foreground cursor-not-allowed opacity-60"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <span className="truncate font-medium block">{eq.nombre}</span>
                          {eq.descripcion && (
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {eq.descripcion}
                            </span>
                          )}
                        </div>
                        {isAdded ? (
                          <Check className="h-3 w-3 text-emerald-600 flex-shrink-0 ml-1" />
                        ) : (
                          <Plus className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-1" />
                        )}
                      </button>
                    )
                  })}
                  {filteredActividadesGrupo.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2 col-span-2 text-center">
                      No se encontraron actividades
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Contenido Servidores */}
              <TabsContent value="servidores" className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar servidor por nombre o equipo..."
                    value={servidorSearch}
                    onChange={(e) => setServidorSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto border rounded-md p-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {filteredServidores.map((serv) => {
                    const isAdded = responsables.some(
                      (r) => r.tipo_responsable === "servidor" && r.servidor_id === serv.id
                    )
                    return (
                      <button
                        key={serv.id}
                        type="button"
                        onClick={() => handleAddServidor(serv)}
                        disabled={isAdded}
                        className={`text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          isAdded
                            ? "bg-muted/60 text-muted-foreground cursor-not-allowed opacity-60"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="truncate font-medium">{serv.nombre_completo}</div>
                          {serv.equipos && serv.equipos.length > 0 && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              {serv.equipos.slice(0, 2).join(", ")}
                            </div>
                          )}
                        </div>
                        {isAdded ? (
                          <Check className="h-3 w-3 text-emerald-600 flex-shrink-0 ml-1" />
                        ) : (
                          <Plus className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-1" />
                        )}
                      </button>
                    )
                  })}
                  {filteredServidores.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2 col-span-2 text-center">
                      No se encontraron servidores
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {eventoParaEditar ? "Guardar Cambios" : "Crear Actividad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
