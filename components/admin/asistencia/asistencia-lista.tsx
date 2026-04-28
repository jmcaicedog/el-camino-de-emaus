"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle2, Clock } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { CaminanteAsistenciaResumen } from "@/lib/types"

interface AsistenciaListaProps {
  caminantes: CaminanteAsistenciaResumen[]
  onToggle: (id: string, llego: boolean) => void
}

export function AsistenciaLista({ caminantes, onToggle }: AsistenciaListaProps) {
  const [search, setSearch] = useState("")
  const [toggling, setToggling] = useState<string | null>(null)

  const formatDisplayName = (value: string) =>
    value
      .trim()
      .toLocaleLowerCase("es")
      .replace(/(^|[\s'’.-])(\p{L})/gu, (_match, separator: string, char: string) => {
        return `${separator}${char.toLocaleUpperCase("es")}`
      })

  const getWhatsAppUrl = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    if (!digits) return ""
    const normalized = digits.startsWith("57") ? digits : `57${digits}`
    return `https://wa.me/${normalized}`
  }

  const filtered = caminantes.filter((c) =>
    c.nombre_completo.toLowerCase().includes(search.toLowerCase())
  )

  const sortedCaminantes = [...filtered].sort((a, b) =>
    a.nombre_completo.localeCompare(b.nombre_completo, "es", { sensitivity: "base" })
  )

  const handleToggle = async (c: CaminanteAsistenciaResumen) => {
    setToggling(c.id)
    await onToggle(c.id, !c.llego)
    setToggling(null)
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="sm:hidden space-y-2">
        {sortedCaminantes.length === 0 && (
          <div className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
            No se encontraron caminantes
          </div>
        )}

        {sortedCaminantes.map((c) => {
          const whatsappUrl = getWhatsAppUrl(c.celular)

          return (
            <div
              key={c.id}
              className={`rounded-lg border p-3 transition-colors ${c.llego ? "bg-emerald-50/70" : "bg-background"}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full overflow-hidden border bg-muted shrink-0">
                  <img
                    src={c.imagen || uiAvatarUrl(c.nombre_completo)}
                    alt={c.nombre_completo}
                    className="block h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{formatDisplayName(c.nombre_completo)}</p>
                  <div className="mt-1 text-xs">
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 hover:text-green-800 hover:underline"
                      >
                        {c.celular}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{c.celular}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {c.mesa_numero ? <Badge variant="outline">Mesa {c.mesa_numero}</Badge> : <Badge variant="secondary">Sin mesa</Badge>}
                    {c.habitacion_nombre ? <Badge variant="secondary">{c.habitacion_nombre}</Badge> : <Badge variant="secondary">Sin asignar</Badge>}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={c.llego ? "default" : "outline"}
                  className={c.llego ? "h-8 bg-emerald-600 hover:bg-emerald-700 text-white border-0" : "h-8"}
                  disabled={toggling === c.id}
                  onClick={() => handleToggle(c)}
                >
                  {c.llego ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden sm:block rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium w-12"></th>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Celular</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Mesa</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Habitación</th>
                <th className="text-right p-3 font-medium">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {sortedCaminantes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    No se encontraron caminantes
                  </td>
                </tr>
              )}
              {sortedCaminantes.map((c) => {
                const whatsappUrl = getWhatsAppUrl(c.celular)

                return (
                <tr
                  key={c.id}
                  className={`border-b last:border-0 transition-colors ${
                    c.llego ? "bg-emerald-50/60" : "hover:bg-muted/30"
                  }`}
                >
                  <td className="p-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden border bg-muted">
                      <img
                        src={c.imagen || uiAvatarUrl(c.nombre_completo)}
                        alt={c.nombre_completo}
                        className="block h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{formatDisplayName(c.nombre_completo)}</span>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">
                    {whatsappUrl ? (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 hover:underline">
                        {c.celular}
                      </a>
                    ) : (
                      c.celular
                    )}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {c.mesa_numero ? (
                      <Badge variant="outline">Mesa {c.mesa_numero}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin mesa</span>
                    )}
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    {c.habitacion_nombre ? (
                      <Badge variant="secondary">{c.habitacion_nombre}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin asignar</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant={c.llego ? "default" : "outline"}
                      className={
                        c.llego
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                          : ""
                      }
                      disabled={toggling === c.id}
                      onClick={() => handleToggle(c)}
                    >
                      {c.llego ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Llegó
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                          Marcar llegada
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
