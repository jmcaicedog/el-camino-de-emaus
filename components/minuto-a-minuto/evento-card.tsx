"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, User, Edit3, Trash2, Phone } from "lucide-react"
import { getColorConfig } from "./minuto-colors"
import { formatTimeRange, getDurationLabel, isEventActiveNow, isEventUpcoming } from "./minuto-helpers"
import type { MinutoEvento } from "@/lib/types"

interface EventoCardProps {
  evento: MinutoEvento
  canManage?: boolean
  onEdit?: (evento: MinutoEvento) => void
  onDelete?: (eventoId: string) => void
  layout?: "list" | "compact"
}

export function EventoCard({
  evento,
  canManage = false,
  onEdit,
  onDelete,
  layout = "list",
}: EventoCardProps) {
  const colorCfg = getColorConfig(evento.color)
  const durationStr = getDurationLabel(evento.fecha_inicio, evento.fecha_fin)
  const timeRangeStr = formatTimeRange(evento.fecha_inicio, evento.fecha_fin)
  const isActive = isEventActiveNow(evento.fecha_inicio, evento.fecha_fin)
  const isUpcoming = !isActive && isEventUpcoming(evento.fecha_inicio)

  const servidoresResp = (evento.responsables || []).filter((r) => r.tipo_responsable === "servidor")
  const equiposResp = (evento.responsables || []).filter((r) => r.tipo_responsable === "equipo")

  return (
    <Card
      className={`border-l-4 transition-all hover:shadow-md ${colorCfg.calendarCard} ${
        isActive ? "ring-2 ring-emerald-500 shadow-md bg-emerald-50/20 dark:bg-emerald-950/20" : ""
      }`}
    >
      <CardContent className="p-3.5 sm:p-4 space-y-2.5">
        {/* Header: Horario + Badges de estado + Botones de acción */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`font-mono text-xs px-2.5 py-0.5 flex items-center gap-1.5 border ${colorCfg.border} ${colorCfg.bg} ${colorCfg.text}`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{timeRangeStr}</span>
              <span className="opacity-70 font-sans">({durationStr})</span>
            </Badge>

            {isActive && (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse text-[11px] gap-1 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white inline-block"></span>
                En curso
              </Badge>
            )}

            {isUpcoming && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 text-[11px]">
                Próximo
              </Badge>
            )}

            {evento.ubicacion && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-[220px]">{evento.ubicacion}</span>
              </span>
            )}
          </div>

          {canManage && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(evento)}
                  title="Editar actividad"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(evento.id)}
                  title="Eliminar actividad"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Título de la actividad */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
            {evento.titulo}
          </h3>
          {evento.descripcion && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">
              {evento.descripcion}
            </p>
          )}
        </div>

        {/* Responsables */}
        {(servidoresResp.length > 0 || equiposResp.length > 0) && (
          <div className="pt-1.5 border-t border-muted flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Users className="h-3 w-3" /> Responsables:
            </span>

            {/* Equipos */}
            {equiposResp.map((r, i) => (
              <Badge
                key={`eq-${r.id || i}`}
                variant="secondary"
                className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 text-[11px] py-0.5 px-2 gap-1"
              >
                <Users className="h-2.5 w-2.5" />
                <span className="font-medium">{r.equipo?.nombre || "Equipo"}</span>
              </Badge>
            ))}

            {/* Servidores */}
            {servidoresResp.map((r, i) => (
              <Badge
                key={`sv-${r.id || i}`}
                variant="secondary"
                className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[11px] py-0.5 px-2 gap-1 inline-flex items-center"
              >
                <User className="h-2.5 w-2.5" />
                <span className="font-medium">{r.servidor?.nombre_completo || "Servidor"}</span>
                {r.servidor?.celular && (
                  <a
                    href={`https://wa.me/57${r.servidor.celular.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-950 dark:hover:text-emerald-100 ml-0.5 inline-flex items-center"
                    title={`Contactar a ${r.servidor.nombre_completo}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="h-2.5 w-2.5" />
                  </a>
                )}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
