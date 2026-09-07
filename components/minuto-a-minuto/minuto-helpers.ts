import { getSafeRetiroStartDate } from "@/lib/retiro-date-range"

export interface RetiroDayInfo {
  index: number
  key: "viernes" | "sabado" | "domingo"
  name: string
  date: Date
  isoDate: string // YYYY-MM-DD
  shortLabel: string
  fullLabel: string
  startHour: number
  endHour: number
}

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`
}

export function formatISODate(d: Date): string {
  const year = d.getFullYear()
  const month = padZero(d.getMonth() + 1)
  const day = padZero(d.getDate())
  return `${year}-${month}-${day}`
}

export function getRetiroDays(retiroDatetime?: string | null): RetiroDayInfo[] {
  const baseStart = getSafeRetiroStartDate(retiroDatetime)

  // Asumimos que baseStart es el viernes
  const viernesDate = new Date(baseStart.getFullYear(), baseStart.getMonth(), baseStart.getDate())
  const sabadoDate = new Date(viernesDate.getTime() + 1 * 24 * 60 * 60 * 1000)
  const domingoDate = new Date(viernesDate.getTime() + 2 * 24 * 60 * 60 * 1000)

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const shortMonthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ]

  return [
    {
      index: 0,
      key: "viernes",
      name: "Viernes",
      date: viernesDate,
      isoDate: formatISODate(viernesDate),
      shortLabel: `Vie ${viernesDate.getDate()} ${shortMonthNames[viernesDate.getMonth()]}`,
      fullLabel: `Viernes ${viernesDate.getDate()} de ${monthNames[viernesDate.getMonth()]}`,
      startHour: 20, // 8:00 PM
      endHour: 24,   // 12:00 AM
    },
    {
      index: 1,
      key: "sabado",
      name: "Sábado",
      date: sabadoDate,
      isoDate: formatISODate(sabadoDate),
      shortLabel: `Sáb ${sabadoDate.getDate()} ${shortMonthNames[sabadoDate.getMonth()]}`,
      fullLabel: `Sábado ${sabadoDate.getDate()} de ${monthNames[sabadoDate.getMonth()]}`,
      startHour: 6,  // 6:00 AM
      endHour: 24,  // 12:00 AM
    },
    {
      index: 2,
      key: "domingo",
      name: "Domingo",
      date: domingoDate,
      isoDate: formatISODate(domingoDate),
      shortLabel: `Dom ${domingoDate.getDate()} ${shortMonthNames[domingoDate.getMonth()]}`,
      fullLabel: `Domingo ${domingoDate.getDate()} de ${monthNames[domingoDate.getMonth()]}`,
      startHour: 6,  // 6:00 AM
      endHour: 17,  // 5:00 PM
    },
  ]
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "--:--"
  let hours = d.getHours()
  const minutes = padZero(d.getMinutes())
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

export function formatTime24(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "00:00"
  return `${padZero(d.getHours())}:${padZero(d.getMinutes())}`
}

export function formatTimeRange(startStr: string, endStr: string): string {
  return `${formatTime(startStr)} - ${formatTime(endStr)}`
}

export function getDurationMinutes(startStr: string, endStr: string): number {
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
  return Math.round((end - start) / (1000 * 60))
}

export function getDurationLabel(startStr: string, endStr: string): string {
  const minutes = getDurationMinutes(startStr, endStr)
  if (minutes < 1) return "Menos de 1 min"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMin = minutes % 60
  if (remainingMin === 0) return `${hours} h`
  return `${hours} h ${remainingMin} min`
}

export function isEventActiveNow(startStr: string, endStr: string): boolean {
  const now = Date.now()
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  return now >= start && now <= end
}

export function isEventUpcoming(startStr: string): boolean {
  const now = Date.now()
  const start = new Date(startStr).getTime()
  const diff = start - now
  // Próximo en las siguientes 2 horas
  return diff > 0 && diff <= 2 * 60 * 60 * 1000
}
