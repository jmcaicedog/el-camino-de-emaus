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

export default function AvatarUploader({ id, name, preview, sizeClass = 'w-24 h-24', onChange }: AvatarUploaderProps) {
  const handleFile = (file?: File | null) => {
    if (!file) return onChange(null, null)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      onChange(file, result)
    }
    reader.onerror = () => onChange(null, null)
    reader.readAsDataURL(file)
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
