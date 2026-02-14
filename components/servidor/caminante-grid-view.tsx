"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CaminanteCard } from "@/components/servidor/caminante-card"
import { uiAvatarUrl } from "@/lib/utils"
import type { Caminante } from "@/lib/types"

interface CaminanteGridViewProps {
  caminantes: Caminante[]
  onUpdate?: () => void
  canEdit?: boolean
}

export function CaminanteGridView({ caminantes, onUpdate, canEdit = true }: CaminanteGridViewProps) {
  const [selectedCaminanteId, setSelectedCaminanteId] = useState<string | null>(null)
  const selectedCaminante = caminantes.find((c) => c.id === selectedCaminanteId)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {caminantes.map((caminante) => (
        <Dialog key={caminante.id} open={selectedCaminanteId === caminante.id} onOpenChange={(open) => {
          setSelectedCaminanteId(open ? caminante.id : null)
        }}>
          <DialogTrigger asChild>
            <div className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className="relative">
                {/* Imagen circular */}
                <img
                  src={caminante.imagen || uiAvatarUrl(caminante.nombre_completo)}
                  alt={caminante.nombre_completo}
                  className="h-24 w-24 rounded-full object-cover shadow-md group-hover:shadow-lg border-2 border-primary/10 group-hover:border-primary/30 transition-all"
                />
                {/* Badge de sorpresa */}
                {caminante.es_sorpresa && (
                  <Badge className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 border-amber-300 border text-xs px-2 py-1 rounded-full shadow-md">
                    🎁
                  </Badge>
                )}
              </div>
              {/* Nombre */}
              <div className="text-center">
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors max-w-28 line-clamp-2 leading-tight uppercase">
                  {caminante.nombre_completo}
                </p>
              </div>
            </div>
          </DialogTrigger>

          {selectedCaminante && (
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedCaminante.nombre_completo}</DialogTitle>
              </DialogHeader>
              <CaminanteCard 
                caminante={selectedCaminante} 
                onUpdate={onUpdate} 
                canEdit={canEdit}
              />
            </DialogContent>
          )}
        </Dialog>
      ))}
    </div>
  )
}
