"use client"

import { ImageIcon } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { Servidor } from "@/lib/types"

interface Props {
  servidor: Servidor
  onImageChange?: (file?: File) => void
  canEdit?: boolean
}

export default function ServidorDetails({ servidor, onImageChange, canEdit = true }: Props) {
  const inputId = `servidor-file-input-${servidor.id}`
  // Debug: ayuda a verificar en la consola del navegador qué datos llegan
  if (typeof window !== 'undefined') console.debug('ServidorDetails props:', servidor)

  return (
    <div className="space-y-4 text-sm">
      {/* Top: avatar + basic info grid (profesión movida a Información Laboral). On md use a 36%/rest split (~+30%) */}
      <div className="grid grid-cols-1 md:grid-cols-[36%_1fr] gap-4 md:gap-6 items-start">
        <div className="relative flex-shrink-0 flex justify-center md:justify-start">
          <img
            src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo, 512)}
            alt={servidor.nombre_completo}
            className="rounded-full h-24 w-24 md:h-36 md:w-36 object-cover shadow-lg"
          />

          {canEdit && (
            <>
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
            </>
          )}
        </div>

  <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 md:gap-4">
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
            <a href={`https://wa.me/57${(servidor.celular ?? '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium truncate">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {servidor.celular ?? '-'}
            </a>
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
        <div className="grid grid-cols-2 gap-2 md:gap-4">
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
              {servidor.celular_contacto ? (
                <a href={`https://wa.me/57${servidor.celular_contacto.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium truncate">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {servidor.celular_contacto}
                </a>
              ) : (
                <div className="truncate">-</div>
              )}
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
              {servidor.celular_contacto_2 ? (
                <a href={`https://wa.me/57${servidor.celular_contacto_2.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium truncate">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {servidor.celular_contacto_2}
                </a>
              ) : (
                <div className="truncate">-</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Información Espiritual (sección vertical, contenido en 1-2 columnas) */}
      <section className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Información Espiritual</h3>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
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
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div>
            <div className="font-medium">Retiros anteriores</div>
            <div className="truncate" title={String(servidor.retiros_anteriores ?? '-')}>{String(servidor.retiros_anteriores ?? '-')}</div>
          </div>
          <div>
            <div className="font-medium">Experiencia en servicio</div>
            <div className="truncate" title={servidor.experiencia_servicio ?? '-'}>{servidor.experiencia_servicio ?? 'Sin información registrada'}</div>
          </div>
          <div>
            <div className="font-medium">Dirección</div>
            <div className="text-muted-foreground whitespace-pre-wrap break-words" title={servidor.direccion ?? '-'}>{servidor.direccion ?? '-'}</div>
          </div>
          <div>
            <div className="font-medium">Talla de camisa</div>
            <div className="truncate" title={servidor.talla_camisa ?? '-'}>{servidor.talla_camisa ?? '-'}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
