const BOGOTA_TIMEZONE = "America/Bogota"

export const DEFAULT_RETIRO_DATETIME = "2026-04-10T16:00:00-05:00"

function getDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: BOGOTA_TIMEZONE,
  }).formatToParts(date)

  const day = parts.find((part) => part.type === "day")?.value ?? ""
  const month = parts.find((part) => part.type === "month")?.value ?? ""
  const year = parts.find((part) => part.type === "year")?.value ?? ""

  return { day, month, year }
}

export function getRetiroRangeLabel(startDate: Date) {
  const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000)
  const start = getDateParts(startDate)
  const end = getDateParts(endDate)

  if (start.month === end.month && start.year === end.year) {
    return `Del ${start.day} al ${end.day} de ${start.month} de ${start.year}`
  }

  if (start.year === end.year) {
    return `Del ${start.day} de ${start.month} al ${end.day} de ${end.month} de ${start.year}`
  }

  return `Del ${start.day} de ${start.month} de ${start.year} al ${end.day} de ${end.month} de ${end.year}`
}

export function getSafeRetiroStartDate(inputDate: string | null | undefined) {
  const parsedRetiroDate = new Date(inputDate ?? "")
  if (!Number.isNaN(parsedRetiroDate.getTime())) return parsedRetiroDate
  return new Date(DEFAULT_RETIRO_DATETIME)
}