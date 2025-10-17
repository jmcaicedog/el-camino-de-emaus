"use client"

import { ImageIcon } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { Servidor } from "@/lib/types"

interface Props {
  servidor: Servidor
  onImageChange?: (file?: File) => void
}

export default function ServidorDetails({ servidor, onImageChange }: Props) {
  const inputId = `servidor-file-input-${servidor.id}`
  // Debug: ayuda a verificar en la consola del navegador qué datos llegan
  if (typeof window !== 'undefined') console.debug('ServidorDetails props:', servidor)

  return (
    <div className="space-y-4 text-sm">
      {/* Top: avatar + basic info grid (profesión movida a Información Laboral). On md use a 36%/rest split (~+30%) */}
      <div className="grid grid-cols-1 md:grid-cols-[36%_1fr] gap-6 items-start">
        <div className="relative flex-shrink-0">
          <img
            src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo, 512)}
            alt={servidor.nombre_completo}
            className="rounded-full h-36 w-36 object-cover shadow-lg"
          />

          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0]
              if (f && onImageChange) onImageChange(f)
            }}
          />

          <button
            type="button"
            aria-label={`Cambiar foto de ${servidor.nombre_completo}`}
            title="Cambiar foto"
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-neutral-100"
            onClick={() => {
              const el = document.getElementById(inputId) as HTMLInputElement | null
              if (el) el.click()
            }}
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>

  <div className="flex-1 min-w-0 grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium">Cédula</div>
            <div className="truncate" title={String(servidor.cedula ?? '-')}>{String(servidor.cedula ?? '-')}</div>
          </div>

          <div>
            <div className="font-medium">Edad</div>
            <div className="truncate" title={servidor.edad ? `${servidor.edad} años` : '-'}>{servidor.edad ? `${servidor.edad} años` : '-'}</div>
          </div>

          <div>
            <div className="font-medium">Celular</div>
            <div className="truncate" title={servidor.celular ?? '-'}>{servidor.celular ?? '-'}</div>
          </div>

          <div>
            <div className="font-medium">Correo</div>
            <div className="truncate" title={servidor.correo ?? '-'}>{servidor.correo ?? '-'}</div>
          </div>

          <div>
            <div className="font-medium">Ciudad</div>
            <div className="truncate" title={servidor.ciudad ?? '-'}>{servidor.ciudad ?? '-'}</div>
          </div>

          <div>
            <div className="font-medium">Estado civil</div>
            <div className="truncate" title={servidor.estado_civil ?? '-'}>{servidor.estado_civil ?? '-'}</div>
          </div>
        </div>
      </div>

      {/* Información Médica */}
      <section className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Información Médica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium">Medicamentos</div>
            <div className="text-muted-foreground whitespace-pre-wrap break-words" title={servidor.medicamentos || '-'}>{servidor.medicamentos || '-'}</div>
          </div>

          <div>
            <div className="font-medium">Restricciones alimenticias</div>
            <div className="text-muted-foreground whitespace-pre-wrap break-words" title={servidor.restricciones_alimenticias || '-'}>{servidor.restricciones_alimenticias || '-'}</div>
          </div>

          <div>
            <div className="font-medium">Tipo de sangre</div>
            <div className="truncate" title={servidor.tipo_sangre ?? '-'}>{servidor.tipo_sangre ?? '-'}</div>
          </div>

          <div>
            <div className="font-medium">EPS</div>
            <div className="truncate" title={servidor.eps ?? '-'}>{servidor.eps ?? '-'}</div>
          </div>
        </div>
      </section>

      {/* Contactos de emergencia */}
      <section className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Contactos de emergencia</h3>
        <div className="space-y-3">
          <div className="grid md:grid-cols-3 gap-2">
            <div>
              <div className="font-medium">Nombre</div>
              <div className="truncate" title={servidor.nombre_contacto_emergencia ?? '-'}>{servidor.nombre_contacto_emergencia ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium">Parentesco</div>
              <div className="truncate" title={servidor.parentesco_contacto ?? '-'}>{servidor.parentesco_contacto ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium">Celular</div>
              <div className="truncate" title={servidor.celular_contacto ?? '-'}>{servidor.celular_contacto ?? '-'}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-2">
            <div>
              <div className="font-medium">Nombre</div>
              <div className="truncate" title={servidor.nombre_contacto_emergencia_2 ?? '-'}>{servidor.nombre_contacto_emergencia_2 ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium">Parentesco</div>
              <div className="truncate" title={servidor.parentesco_contacto_2 ?? '-'}>{servidor.parentesco_contacto_2 ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium">Celular</div>
              <div className="truncate" title={servidor.celular_contacto_2 ?? '-'}>{servidor.celular_contacto_2 ?? '-'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Información Espiritual (sección vertical, contenido en 1-2 columnas) */}
      <section className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Información Espiritual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium">Parroquia</div>
            <div className="truncate" title={servidor.parroquia ?? '-'}>{servidor.parroquia ?? '-'}</div>
          </div>
          <div>
            <div className="font-medium">Párroco</div>
            <div className="truncate" title={servidor.parroco ?? '-'}>{servidor.parroco ?? '-'}</div>
          </div>
        </div>
      </section>

      {/* Información Laboral (sección vertical, contenido en hasta 3 columnas) */}
      <section className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Información Laboral</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="font-medium">Profesión</div>
            <div className="truncate" title={servidor.profesion ?? '-'}>{servidor.profesion ?? '-'}</div>
          </div>
          <div>
            <div className="font-medium">Empresa</div>
            <div className="truncate" title={servidor.empresa ?? '-'}>{servidor.empresa ?? '-'}</div>
          </div>
          <div>
            <div className="font-medium">Cargo</div>
            <div className="truncate" title={servidor.cargo ?? '-'}>{servidor.cargo ?? '-'}</div>
          </div>
        </div>
      </section>

      {/* Información de Servicio (sección vertical, contenido en hasta 2 columnas) */}
      <section className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Información de Servicio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium">Retiros anteriores</div>
            <div className="truncate" title={String(servidor.retiros_anteriores ?? '-')}>{String(servidor.retiros_anteriores ?? '-')}</div>
          </div>
          <div>
            <div className="font-medium">Experiencia en servicio</div>
            <div className="truncate" title={servidor.experiencia_servicio ?? '-'}>{servidor.experiencia_servicio ?? 'Sin información registrada'}</div>
          </div>
        </div>
      </section>
    </div>
  )
}

