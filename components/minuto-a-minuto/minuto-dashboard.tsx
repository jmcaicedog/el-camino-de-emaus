"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Loader2,
  CalendarDays,
  List,
  LayoutList,
  User,
  Shield,
  Sparkles,
  MapPin,
  RefreshCw,
  Info,
  Edit3,
  Trash2,
} from "lucide-react"
import { EventoModal } from "./evento-modal"
import { EventoCard } from "./evento-card"
import { getRetiroDays, type RetiroDayInfo, formatISODate, formatTimeRange, getDurationLabel, isEventActiveNow } from "./minuto-helpers"
import { getColorConfig, MINUTO_COLORS } from "./minuto-colors"
import type { MinutoEvento, Servidor, Equipo } from "@/lib/types"

export function MinutoDashboard() {
  const { toast } = useToast()

  const [eventos, setEventos] = useState<MinutoEvento[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [canManage, setCanManage] = useState(false)
  const [isFullViewer, setIsFullViewer] = useState(false)
  const [servidorNombre, setServidorNombre] = useState<string | null>(null)
  const [retiroSettings, setRetiroSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filtros y vistas
  const [selectedDayKey, setSelectedDayKey] = useState<"viernes" | "sabado" | "domingo" | "todos">("viernes")
  const [viewMode, setViewMode] = useState<"lista" | "compacta">("lista")
  const [searchTerm, setSearchTerm] = useState("")
  const [onlyMine, setOnlyMine] = useState(false)
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([])

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eventoParaEditar, setEventoParaEditar] = useState<MinutoEvento | null>(null)
  const [eventoParaEliminar, setEventoParaEliminar] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const retiroDays = useMemo<RetiroDayInfo[]>(() => {
    return getRetiroDays(retiroSettings?.retiro_datetime)
  }, [retiroSettings])

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const [eventosRes, settingsRes, servidoresRes, equiposRes] = await Promise.all([
        fetch("/api/minuto-a-minuto"),
        fetch("/api/retiro-settings", { cache: "no-store" }),
        fetch("/api/servidores"),
        fetch("/api/equipos"),
      ])

      if (eventosRes.ok) {
        const data = await eventosRes.json()
        setEventos(data.eventos || [])
        setCanManage(Boolean(data.canManage))
        setIsFullViewer(Boolean(data.isFullViewer))
        setServidorNombre(data.servidorNombre || null)
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json()
        setRetiroSettings(sData)
      }

      if (servidoresRes.ok) {
        const servData = await servidoresRes.json()
        setServidores(servData || [])
      }

      if (equiposRes.ok) {
        const eqData = await equiposRes.json()
        setEquipos(eqData || [])
      }
    } catch (error) {
      toast({
        title: "Error de carga",
        description: "No se pudieron cargar los datos del Minuto a Minuto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAllData()
    toast({
      title: "Actualizado",
      description: "Datos del cronograma sincronizados",
    })
  }

  const handleOpenCreate = () => {
    setEventoParaEditar(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (evento: MinutoEvento) => {
    setEventoParaEditar(evento)
    setIsModalOpen(true)
  }

  const handleSaveEvento = (savedEvento: MinutoEvento) => {
    setEventos((prev) => {
      const exists = prev.some((e) => e.id === savedEvento.id)
      if (exists) {
        return prev.map((e) => (e.id === savedEvento.id ? savedEvento : e)).sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
      }
      return [...prev, savedEvento].sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
    })
  }

  const handleDeleteEvento = async () => {
    if (!eventoParaEliminar) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/minuto-a-minuto/${eventoParaEliminar}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Error al eliminar")
      }
      setEventos((prev) => prev.filter((e) => e.id !== eventoParaEliminar))
      toast({
        title: "Actividad eliminada",
        description: "El evento se eliminó correctamente de la agenda",
      })
      setEventoParaEliminar(null)
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la actividad",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const availableColors = useMemo(() => {
    const eventColorIds = new Set(eventos.map((evento) => getColorConfig(evento.color).id))
    return Object.values(MINUTO_COLORS).filter((color) => eventColorIds.has(color.id))
  }, [eventos])

  const toggleColorFilter = (colorId: string) => {
    setSelectedColorIds((prev) =>
      prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
    )
  }

  // Filtrado de eventos
  const filteredEventos = useMemo(() => {
    return eventos.filter((ev) => {
      // Filtro por color
      if (selectedColorIds.length > 0 && !selectedColorIds.includes(getColorConfig(ev.color).id)) {
        return false
      }

      // Filtro por día
      if (selectedDayKey !== "todos") {
        const targetDay = retiroDays.find((d) => d.key === selectedDayKey)
        if (targetDay) {
          const evDate = new Date(ev.fecha_inicio)
          const evIso = formatISODate(evDate)
          if (evIso !== targetDay.isoDate) return false
        }
      }

      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchesTitle = ev.titulo.toLowerCase().includes(q)
        const matchesDesc = (ev.descripcion || "").toLowerCase().includes(q)
        const matchesUbi = (ev.ubicacion || "").toLowerCase().includes(q)
        const matchesResp = (ev.responsables || []).some((r) => {
          if (r.tipo_responsable === "servidor") {
            return (r.servidor?.nombre_completo || "").toLowerCase().includes(q)
          }
          return (r.equipo?.nombre || "").toLowerCase().includes(q)
        })

        if (!matchesTitle && !matchesDesc && !matchesUbi && !matchesResp) {
          return false
        }
      }

      // Filtro solo mías (cuando el usuario tiene full view y quiere filtrar su nombre)
      if (onlyMine && servidorNombre) {
        const isMyResp = (ev.responsables || []).some(
          (r) => r.tipo_responsable === "servidor" && r.servidor?.nombre_completo === servidorNombre
        )
        if (!isMyResp) return false
      }

      return true
    })
  }, [eventos, selectedColorIds, selectedDayKey, retiroDays, searchTerm, onlyMine, servidorNombre])

  // Agrupamiento por día
  const groupedByDay = useMemo(() => {
    const map = new Map<string, MinutoEvento[]>()
    for (const d of retiroDays) {
      map.set(d.isoDate, [])
    }
    for (const ev of filteredEventos) {
      const evDate = new Date(ev.fecha_inicio)
      const evIso = formatISODate(evDate)
      const list = map.get(evIso) || []
      list.push(ev)
      map.set(evIso, list)
    }
    return map
  }, [filteredEventos, retiroDays])

  const selectedDayInfo = retiroDays.find((d) => d.key === selectedDayKey)
  const defaultDayIndex = selectedDayInfo ? selectedDayInfo.index : 0

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando agenda del Minuto a Minuto...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-card to-muted/40 p-4 sm:p-6 rounded-xl border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Minuto a Minuto</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Cronograma y agenda operativa del Retiro de Emaús
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
            title="Actualizar agenda"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>

          {canManage && (
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Nueva Actividad</span>
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Controles y Filtros */}
      <div className="space-y-3">
        {/* Selector de Día */}
        <div className="rounded-xl border bg-card p-2 space-y-2 lg:flex lg:items-center lg:justify-between lg:gap-3 lg:border-0 lg:bg-transparent lg:p-0 lg:space-y-0">
          <Tabs
            value={selectedDayKey}
            onValueChange={(val: any) => setSelectedDayKey(val)}
            className="w-full lg:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full lg:w-auto h-auto p-1">
              {retiroDays.map((d) => (
                <TabsTrigger
                  key={d.key}
                  value={d.key}
                  className="text-xs sm:text-sm py-1.5 px-2.5 data-[state=active]:font-semibold"
                >
                  <span className="sm:hidden">{d.name.slice(0, 3)}</span>
                  <span className="hidden sm:inline">{d.name}</span>
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="todos"
                className="text-xs sm:text-sm py-1.5 px-2.5 data-[state=active]:font-semibold"
              >
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center justify-between gap-2 lg:contents">
            {availableColors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 lg:mx-auto lg:justify-center">
                <Button
                  variant={selectedColorIds.length === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedColorIds([])}
                  className="h-8 px-2.5 text-xs"
                >
                  Todos
                </Button>
                {availableColors.map((color) => {
                  const isSelected = selectedColorIds.includes(color.id)
                  return (
                    <Button
                      key={color.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleColorFilter(color.id)}
                      className="h-8 w-8 p-0"
                      title={color.label}
                      aria-label={`Filtrar por ${color.label}`}
                    >
                      <span className={`h-4 w-4 rounded-full ${color.accent}`} />
                    </Button>
                  )
                })}
              </div>
            )}

            {/* Toggle de Modo de Vista (Lista vs Compacta) */}
            <div className="ml-auto flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === "lista" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("lista")}
                className="h-8 text-xs gap-1.5 px-3"
              >
                <List className="h-3.5 w-3.5" />
                <span>Detallada</span>
              </Button>
              <Button
                variant={viewMode === "compacta" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("compacta")}
                className="h-8 text-xs gap-1.5 px-3"
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span>Compacta</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Buscador y Filtros Secundarios */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, lugar o responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm h-9 bg-card"
            />
          </div>

          {servidorNombre && isFullViewer && (
            <Button
              variant={onlyMine ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyMine(!onlyMine)}
              className="h-9 text-xs gap-1.5 shrink-0"
            >
              <User className="h-3.5 w-3.5" />
              <span>Mis actividades asignadas</span>
            </Button>
          )}

          <div className="text-xs text-muted-foreground flex items-center gap-1 self-center sm:self-auto px-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{filteredEventos.length} {filteredEventos.length === 1 ? "actividad" : "actividades"}</span>
          </div>
        </div>

      </div>

      {/* Mensaje Informativo para Servidores con vista acotada */}
      {!isFullViewer && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 p-3 rounded-lg flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
          <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <strong>Vista personalizada:</strong> Estás visualizando únicamente las actividades en las que tú o tus equipos están asignados como responsables.
          </div>
        </div>
      )}

      {/* Renderizado de Actividades */}
      {filteredEventos.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-14 px-4 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-semibold">No hay actividades para mostrar</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchTerm || selectedColorIds.length > 0
                  ? "No se encontraron coincidencias con los términos de búsqueda."
                  : !isFullViewer
                  ? "No tienes actividades programadas bajo tu responsabilidad en este momento."
                  : "Aún no se han programado actividades para este día del retiro."}
              </p>
            </div>
            {canManage && !searchTerm && (
              <Button onClick={handleOpenCreate} size="sm" className="mt-2 gap-1.5">
                <Plus className="h-4 w-4" />
                <span>Crear la primera actividad</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "lista" ? (
        /* VISTA DETALLADA */
        <div className="space-y-6">
          {retiroDays.map((d) => {
            const dayEvents = groupedByDay.get(d.isoDate) || []
            if (selectedDayKey !== "todos" && selectedDayKey !== d.key) return null
            if (dayEvents.length === 0) return null

            return (
              <div key={d.key} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Badge variant="secondary" className="font-semibold text-xs py-1 px-3">
                    {d.fullLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    ({dayEvents.length} {dayEvents.length === 1 ? "actividad" : "actividades"})
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                  {dayEvents.map((evento) => (
                    <EventoCard
                      key={evento.id}
                      evento={evento}
                      canManage={canManage}
                      onEdit={handleOpenEdit}
                      onDelete={(id) => setEventoParaEliminar(id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* VISTA COMPACTA (UNA SOLA LÍNEA POR ACTIVIDAD CON TÍTULO Y HORA) */
        <div className="space-y-6">
          {retiroDays.map((d) => {
            const dayEvents = groupedByDay.get(d.isoDate) || []
            if (selectedDayKey !== "todos" && selectedDayKey !== d.key) return null
            if (dayEvents.length === 0) return null

            return (
              <div key={d.key} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Badge variant="secondary" className="font-semibold text-xs py-1 px-3">
                    {d.fullLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    ({dayEvents.length} {dayEvents.length === 1 ? "actividad" : "actividades"})
                  </span>
                </div>

                <div className="border rounded-xl bg-card overflow-hidden divide-y shadow-xs">
                  {dayEvents.map((evento) => {
                    const colorCfg = getColorConfig(evento.color)
                    const timeRangeStr = formatTimeRange(evento.fecha_inicio, evento.fecha_fin)
                    const isActive = isEventActiveNow(evento.fecha_inicio, evento.fecha_fin)

                    return (
                      <div
                        key={evento.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 border-l-4 transition-colors hover:bg-muted/40 ${colorCfg.calendarCard} ${
                          isActive ? "bg-emerald-50/40 dark:bg-emerald-950/30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                          <span
                            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`}
                          >
                            {timeRangeStr}
                          </span>

                          <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {evento.titulo}
                          </span>

                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded shrink-0 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 inline-block" />
                              En curso
                            </span>
                          )}
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(evento)}
                              title="Editar actividad"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setEventoParaEliminar(evento.id)}
                              title="Eliminar actividad"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Crear / Editar */}
      {canManage && (
        <EventoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEventoParaEditar(null)
          }}
          onSaved={handleSaveEvento}
          eventoParaEditar={eventoParaEditar}
          retiroDays={retiroDays}
          defaultDayIndex={defaultDayIndex}
          servidores={servidores}
          equipos={equipos}
        />
      )}

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmDialog
        open={Boolean(eventoParaEliminar)}
        onOpenChange={(open) => !open && setEventoParaEliminar(null)}
        title="¿Eliminar esta actividad?"
        description="Esta acción eliminará la actividad y sus asignaciones del minuto a minuto. ¿Deseas continuar?"
        onConfirm={handleDeleteEvento}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
