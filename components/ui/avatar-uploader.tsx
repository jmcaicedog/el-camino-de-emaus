"use client"

import React from 'react'
import { ImageIcon } from 'lucide-react'
import { uiAvatarUrl } from '@/lib/utils'

interface AvatarUploaderProps {
  id: string
  name?: string
  preview?: string | null
  sizeClass?: string // e.g. "w-24 h-24"
  onChange: (file: File | null, dataUrl?: string | null) => void
}

/**
 * Comprime una imagen si excede el tamaño máximo
 * @param file Archivo de imagen original
 * @param maxSizeKB Tamaño máximo en KB (por defecto 800KB para quedar muy por debajo del límite)
 * @returns Promise con el data URL comprimido
 */
async function compressImage(file: File, maxSizeKB: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Si la imagen es muy grande, reducir dimensiones manteniendo aspect ratio
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Intentar comprimir con diferentes calidades
        let quality = 0.85
        let dataUrl = canvas.toDataURL('image/jpeg', quality)
        
        // Reducir calidad hasta que el tamaño sea aceptable
        // Base64 aumenta el tamaño en ~37%, por eso multiplicamos por 1.37
        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.05
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }
        
        console.log(`Imagen comprimida: ${Math.round(dataUrl.length / 1024)}KB, calidad: ${Math.round(quality * 100)}%`)
        resolve(dataUrl)
      }
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}

export default function AvatarUploader({ id, name, preview, sizeClass = 'w-24 h-24', onChange }: AvatarUploaderProps) {
  const handleFile = async (file?: File | null) => {
    if (!file) {
      onChange(null, null)
      return
    }
    
    try {
      // Comprimir la imagen automáticamente a 800KB (quedará ~1.1MB en base64)
      const compressedDataUrl = await compressImage(file, 800)
      onChange(file, compressedDataUrl)
    } catch (error) {
      console.error('Error al procesar la imagen:', error)
      // Si falla la compresión, intentar con la imagen original
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        onChange(file, result)
      }
      reader.onerror = () => onChange(null, null)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className={`relative inline-block ${sizeClass}`}>
      <div className="rounded-full overflow-hidden bg-gray-100 w-full h-full">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : name ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={uiAvatarUrl(name, 512)} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-6 h-6" />
          </div>
        )}
      </div>

      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0] ?? null
          handleFile(f ?? undefined)
        }}
      />

      <button
        type="button"
        aria-label="Cambiar foto"
        className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-neutral-100 transform translate-x-1/2 translate-y-1/2"
        onClick={() => {
          const el = document.getElementById(id) as HTMLInputElement | null
          if (el) el.click()
        }}
      >
        <ImageIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
