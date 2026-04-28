"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Users } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { CaminanteAsistenciaResumen, Mesa } from "@/lib/types"

interface AsistenciaMesasProps {
  caminantes: CaminanteAsistenciaResumen[]
  mesas: Mesa[]
  mesaResponsables: Record<string, { lider: string | null; colider: string | null }>
  onToggle: (id: string, llego: boolean) => void
}

export function AsistenciaMesas({ caminantes, mesas, mesaResponsables, onToggle }: AsistenciaMesasProps) {
  const [toggling, setToggling] = useState<string | null>(null)

  const formatDisplayName = (value: string) =>
    value
      .trim()
      .toLocaleLowerCase("es")
      .replace(/(^|[\s'’.-])(\p{L})/gu, (_match, separator: string, char: string) => {
        return `${separator}${char.toLocaleUpperCase("es")}`
      })

  const getCaminantesDeMesa = (mesaId: string) =>
    caminantes.filter((c) => c.mesa_id === mesaId)

  const handleToggle = async (c: CaminanteAsistenciaResumen) => {
    setToggling(c.id)
    await onToggle(c.id, !c.llego)
    setToggling(null)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mesas.map((mesa) => {
        const mesaCaminantes = getCaminantesDeMesa(mesa.id).sort((a, b) =>
          a.nombre_completo.localeCompare(b.nombre_completo, "es", { sensitivity: "base" })
        )
        const responsables = mesaResponsables[mesa.id] ?? { lider: null, colider: null }
        const total = mesaCaminantes.length
        const llegaron = mesaCaminantes.filter((c) => c.llego).length
        const porcentaje = total > 0 ? Math.round((llegaron / total) * 100) : 0
        const normalizedMesaName = (mesa.nombre ?? "").trim().toLowerCase()
        const defaultMesaName = `mesa ${mesa.numero}`.toLowerCase()
        const showCustomName = Boolean(mesa.nombre?.trim()) && normalizedMesaName !== defaultMesaName

        return (
          <Card key={mesa.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Mesa {mesa.numero}
                  {showCustomName ? ` — ${mesa.nombre?.trim()}` : ""}
                </CardTitle>
                <Badge
                  variant={total === 0 ? "secondary" : llegaron === total ? "default" : "outline"}
                  className={
                    total > 0 && llegaron === total
                      ? "bg-emerald-600 text-white border-0"
                      : total > 0 && llegaron > 0
                      ? "border-amber-400 text-amber-700"
                      : ""
                  }
                >
                  {llegaron}/{total}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Asistencia
                  </span>
                  <span>{porcentaje}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      porcentaje === 100
                        ? "bg-emerald-500"
                        : porcentaje > 0
                        ? "bg-amber-400"
                        : "bg-transparent"
                    }`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex-1">
              {total === 0 ? (
                <p className="text-xs text-muted-foreground">Sin caminantes asignados</p>
              ) : (
                <ul className="space-y-2">
                  {mesaCaminantes.map((c) => (
                    <li
                      key={c.id}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                        c.llego ? "bg-emerald-50" : "bg-muted/30"
                      }`}
                    >
                      <img
                        src={c.imagen || uiAvatarUrl(c.nombre_completo)}
                        alt={c.nombre_completo}
                        className="h-7 w-7 rounded-full object-cover border shrink-0"
                      />
                      <span className="text-xs font-medium flex-1 line-clamp-1">
                        {formatDisplayName(c.nombre_completo)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-6 w-6 shrink-0 ${
                          c.llego
                            ? "text-emerald-600 hover:text-emerald-700"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        disabled={toggling === c.id}
                        onClick={() => handleToggle(c)}
                        title={c.llego ? "Desmarcar llegada" : "Marcar llegada"}
                      >
                        {c.llego ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">Líder:</span>{" "}
                  {responsables.lider ? formatDisplayName(responsables.lider) : "Sin asignar"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Colíder:</span>{" "}
                  {responsables.colider ? formatDisplayName(responsables.colider) : "Sin asignar"}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
