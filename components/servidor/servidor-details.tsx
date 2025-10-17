"use client"

import React from "react"
import { ImageIcon } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { Servidor } from "@/lib/types"

interface Props {
  servidor: Servidor
  onImageChange: (file?: File) => void
}

export default function ServidorDetails({ servidor, onImageChange }: Props) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative flex-shrink-0">
          <img
            src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo, 512)}
            alt={servidor.nombre_completo}
            className="rounded-full h-36 w-36 object-cover shadow-lg"
          />

          <input
            id={`servidor-file-input-${servidor.id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0]
              if (f) onImageChange(f)
            }}
          />

          <button
            type="button"
            aria-label={`Cambiar foto de ${servidor.nombre_completo}`}
            title="Cambiar foto"
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-neutral-100"
            onClick={() => {
              const el = document.getElementById(`servidor-file-input-${servidor.id}`) as HTMLInputElement | null
              if (el) el.click()
            }}
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 grid md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Cédula:</span> {servidor.cedula}
          </div>
          <div>
            <span className="font-medium">Edad:</span> {servidor.edad} años
          </div>
          <div>
            <span className="font-medium">Celular:</span> {servidor.celular}
          </div>
          <div>
            <span className="font-medium">Correo:</span> {servidor.correo}
          </div>
          <div>
            <span className="font-medium">Ciudad:</span> {servidor.ciudad}
          </div>
          <div>
            <span className="font-medium">Estado Civil:</span> {servidor.estado_civil}
          </div>
          <div>
            <span className="font-medium">Profesión:</span> {servidor.profesion || "-"}
          </div>
          <div>
            <span className="font-medium">EPS:</span> {servidor.eps}
          </div>
          <div>
            <span className="font-medium">Tipo de Sangre:</span> {servidor.tipo_sangre}
          </div>
          <div>
            <span className="font-medium">Parroquia:</span> {servidor.parroquia}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Contactos de emergencia</h3>
        <div className="space-y-1">
          <div>
            <span className="font-medium">Nombre:</span> {servidor.nombre_contacto_emergencia}
          </div>
          <div>
            <span className="font-medium">Parentesco:</span> {servidor.parentesco_contacto}
          </div>
          <div>
            <span className="font-medium">Celular:</span> {servidor.celular_contacto}
          </div>

          {servidor.nombre_contacto_emergencia_2 && (
            <div className="pt-2">
              <div>
                <span className="font-medium">Nombre:</span> {servidor.nombre_contacto_emergencia_2}
              </div>
              <div>
                <span className="font-medium">Parentesco:</span> {servidor.parentesco_contacto_2}
              </div>
              <div>
                <span className="font-medium">Celular:</span> {servidor.celular_contacto_2}
              </div>
            </div>
          )}
        </div>
      </div>

      {(servidor.medicamentos || servidor.restricciones_alimenticias) && (
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Información Médica</h3>
          {servidor.medicamentos && (
            <div className="mb-2">
              <span className="font-medium">Medicamentos:</span>
              <p className="text-muted-foreground">{servidor.medicamentos}</p>
            </div>
          )}
          {servidor.restricciones_alimenticias && (
            <div>
              <span className="font-medium">Restricciones Alimenticias:</span>
              <p className="text-muted-foreground">{servidor.restricciones_alimenticias}</p>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Información Espiritual</h3>
        <div className="space-y-1">
          <div>
            <span className="font-medium">Parroquia:</span> {servidor.parroquia || '-'}
          </div>
          <div>
            <span className="font-medium">Párroco:</span> {servidor.parroco || '-'}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Información de Servicio</h3>
        <div className="space-y-1">
          <div>
            <span className="font-medium">Retiros anteriores:</span> {servidor.retiros_anteriores ?? '-'}
          </div>
          <div>
            <span className="font-medium">Experiencia en servicio:</span>
            <div className="text-muted-foreground">{servidor.experiencia_servicio || 'Sin información registrada'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
