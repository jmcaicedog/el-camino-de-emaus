const BOGOTA_OFFSET = "-05:00"
const BOGOTA_TIMEZONE = "America/Bogota"

export interface SantisimoSlot {
  inicio: string
  dayKey: "viernes" | "sabado" | "domingo"
  dayLabel: string
  timeLabel: string
}

function retiroDateKey(retiroDatetime: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: BOGOTA_TIMEZONE,
  }).formatToParts(new Date(retiroDatetime))

  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value
  return `${year}-${month}-${day}`
}

function addCalendarDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function formatHour(hour: number) {
  const normalizedHour = hour % 24
  const period = normalizedHour >= 12 ? "p. m." : "a. m."
  const displayHour = normalizedHour % 12 || 12
  return `${displayHour}:00 ${period}`
}

export function getSantisimoSlots(retiroDatetime: string): SantisimoSlot[] {
  const friday = retiroDateKey(retiroDatetime)
  const definitions = [
    { dayOffset: 0, dayKey: "viernes" as const, dayLabel: "Viernes", startHour: 15, endHour: 24 },
    { dayOffset: 1, dayKey: "sabado" as const, dayLabel: "Sábado", startHour: 0, endHour: 24 },
    { dayOffset: 2, dayKey: "domingo" as const, dayLabel: "Domingo", startHour: 0, endHour: 13 },
  ]

  return definitions.flatMap((definition) => {
    const dateKey = addCalendarDays(friday, definition.dayOffset)
    return Array.from({ length: definition.endHour - definition.startHour }, (_, index) => {
      const hour = definition.startHour + index
      const nextHour = hour + 1
      const inicio = `${dateKey}T${String(hour).padStart(2, "0")}:00:00${BOGOTA_OFFSET}`
      return {
        inicio,
        dayKey: definition.dayKey,
        dayLabel: definition.dayLabel,
        timeLabel: `${formatHour(hour)} - ${formatHour(nextHour)}`,
      }
    })
  })
}

export function isValidSantisimoSlot(retiroDatetime: string, turnoInicio: string) {
  const parsed = new Date(turnoInicio)
  if (Number.isNaN(parsed.getTime())) return false
  const normalized = parsed.toISOString()
  return getSantisimoSlots(retiroDatetime).some((slot) => new Date(slot.inicio).toISOString() === normalized)
}

export function formatSantisimoTurn(turnoInicio: string) {
  const date = new Date(turnoInicio)
  const day = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: BOGOTA_TIMEZONE,
  }).format(date)
  const time = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: BOGOTA_TIMEZONE,
  }).format(date)
  return `${day}, ${time}`
}
