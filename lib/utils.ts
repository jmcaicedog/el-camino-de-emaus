import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a UI Avatars URL for a given name.
 * Example: https://ui-avatars.com/api/?name=Juan+Perez&background=random&rounded=true&size=256
 */
export function uiAvatarUrl(name: string, size = 256) {
  const encoded = encodeURIComponent(name || "Usuario")
  return `https://ui-avatars.com/api/?name=${encoded}&background=random&rounded=true&size=${size}`
}

/**
 * Normaliza nombres propios al formato de mayúscula inicial por palabra.
 * Ejemplo: "jUaN pEReZ" -> "Juan Perez"
 */
export function formatPersonName(value: string | null | undefined): string {
  if (!value) return ""

  const compact = value.trim().replace(/\s+/g, " ")
  const lower = compact.toLocaleLowerCase("es-CO")

  return lower.replace(/\p{L}+/gu, (word) => {
    const first = word.charAt(0).toLocaleUpperCase("es-CO")
    return `${first}${word.slice(1)}`
  })
}
