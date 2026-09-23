import jsPDF from "jspdf"
import type { EdificioConHabitaciones, HabitacionConAsignaciones } from "@/lib/types"

interface ExportAlojamientoPdfParams {
  edificios: EdificioConHabitaciones[]
  edificioIds: string[]
}

type RoomState = "noBeds" | "full" | "empty" | "partial"

const STATE_COLORS: Record<RoomState, { border: [number, number, number]; bg: [number, number, number] }> = {
  noBeds: { border: [203, 213, 225], bg: [241, 245, 249] },
  full: { border: [252, 165, 165], bg: [254, 242, 242] },
  empty: { border: [110, 231, 183], bg: [236, 253, 245] },
  partial: { border: [252, 211, 77], bg: [255, 251, 235] },
}

function getRoomState(habitacion: HabitacionConAsignaciones): RoomState {
  const ocupadas = habitacion.asignaciones.length
  const libres = Math.max(habitacion.camas_total - ocupadas, 0)
  if (habitacion.camas_total === 0) return "noBeds"
  if (libres === 0) return "full"
  if (ocupadas === 0) return "empty"
  return "partial"
}

function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}

function estimateCardHeight(habitacion: HabitacionConAsignaciones): number {
  const headerHeight = 6
  const bedsRowHeight = habitacion.camas_total > 0 ? 6 : 5
  const occupantsHeight = habitacion.asignaciones.length * 4.2
  const padding = 5
  return headerHeight + bedsRowHeight + occupantsHeight + padding
}

function drawHabitacionCard(doc: jsPDF, habitacion: HabitacionConAsignaciones, x: number, y: number, width: number) {
  const height = estimateCardHeight(habitacion)
  const state = getRoomState(habitacion)
  const colors = STATE_COLORS[state]

  doc.setDrawColor(...colors.border)
  doc.setFillColor(...colors.bg)
  doc.roundedRect(x, y, width, height, 1.5, 1.5, "FD")

  const padX = x + 3
  let cursorY = y + 5

  doc.setFontSize(9.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 30, 30)
  doc.text(truncateText(doc, habitacion.nombre, width - 6), padX, cursorY)

  if (habitacion.camas_total === 0) {
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(90, 90, 90)
    doc.text("Sin camas", padX, cursorY + 5)
    return height
  }

  cursorY += 5
  const dotDiameter = 3
  const dotGap = 1.8
  let dotX = padX + dotDiameter / 2
  for (let bedNumber = 1; bedNumber <= habitacion.camas_total; bedNumber += 1) {
    const assignment = habitacion.asignaciones.find((a) => a.cama_numero === bedNumber)
    if (assignment) {
      doc.setFillColor(220, 38, 38)
      doc.setDrawColor(220, 38, 38)
      doc.circle(dotX, cursorY, dotDiameter / 2, "FD")
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.3)
      const r = dotDiameter / 2 - 0.6
      doc.line(dotX - r, cursorY - r, dotX + r, cursorY + r)
      doc.line(dotX - r, cursorY + r, dotX + r, cursorY - r)
      doc.setLineWidth(0.2)
    } else {
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(148, 163, 184)
      doc.circle(dotX, cursorY, dotDiameter / 2, "FD")
    }
    dotX += dotDiameter + dotGap
  }

  cursorY += 4.5
  const sorted = [...habitacion.asignaciones].sort((a, b) => a.cama_numero - b.cama_numero)
  doc.setFontSize(7.2)
  doc.setFont("helvetica", "normal")
  for (const asignacion of sorted) {
    const dotColor: [number, number, number] = asignacion.ronca_al_dormir ? [225, 29, 72] : [5, 150, 105]
    doc.setFillColor(...dotColor)
    doc.circle(padX + 0.8, cursorY - 0.9, 0.8, "F")
    doc.setTextColor(51, 65, 85)
    doc.text(truncateText(doc, asignacion.persona_nombre, width - 9), padX + 3, cursorY)
    cursorY += 4.2
  }

  return height
}

function drawLegend(doc: jsPDF, marginX: number, y: number) {
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)

  let x = marginX
  const items: { color: [number, number, number]; label: string }[] = [
    { color: STATE_COLORS.empty.border, label: "Vacía" },
    { color: STATE_COLORS.partial.border, label: "Parcial" },
    { color: STATE_COLORS.full.border, label: "Llena" },
    { color: STATE_COLORS.noBeds.border, label: "Sin camas" },
  ]

  for (const item of items) {
    doc.setFillColor(...item.color)
    doc.roundedRect(x, y - 3, 4, 3.5, 0.5, 0.5, "F")
    doc.text(item.label, x + 5.5, y)
    x += doc.getTextWidth(item.label) + 12
  }

  doc.setFillColor(225, 29, 72)
  doc.circle(x + 1.5, y - 1.2, 1.4, "F")
  doc.text("Ronca", x + 4, y)
  x += doc.getTextWidth("Ronca") + 10

  doc.setFillColor(5, 150, 105)
  doc.circle(x + 1.5, y - 1.2, 1.4, "F")
  doc.text("No ronca", x + 4, y)
}

export function exportAlojamientoPDF({ edificios, edificioIds }: ExportAlojamientoPdfParams) {
  const seleccionados = edificios.filter((e) => edificioIds.includes(e.id))
  if (seleccionados.length === 0) return

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 10
  const marginBottom = 12
  const columnGap = 4
  const columns = 3
  const columnWidth = (pageWidth - marginX * 2 - columnGap * (columns - 1)) / columns

  doc.setFontSize(15)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Distribución de Habitaciones", marginX, 15)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100)
  doc.text(`Generado el ${new Date().toLocaleString("es-CO")}`, marginX, 21)
  drawLegend(doc, marginX, 27)

  let cursorY = 34

  seleccionados.forEach((edificio, edificioIndex) => {
    if (edificioIndex > 0) {
      doc.addPage()
      cursorY = 15
    }

    doc.setFontSize(12.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(edificio.nombre, marginX, cursorY)
    cursorY += 6

    if (edificio.habitaciones.length === 0) {
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100)
      doc.text("Este edificio todavía no tiene habitaciones configuradas.", marginX, cursorY)
      cursorY += 8
      return
    }

    const columnX = Array.from({ length: columns }, (_, i) => marginX + i * (columnWidth + columnGap))
    const columnCursor = Array.from({ length: columns }, () => cursorY)

    edificio.habitaciones.forEach((habitacion) => {
      const targetColumn = columnCursor.indexOf(Math.min(...columnCursor))
      const cardHeight = estimateCardHeight(habitacion)

      if (columnCursor[targetColumn] + cardHeight > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = 15
        for (let i = 0; i < columns; i += 1) columnCursor[i] = cursorY
      }

      drawHabitacionCard(doc, habitacion, columnX[targetColumn], columnCursor[targetColumn], columnWidth)
      columnCursor[targetColumn] += cardHeight + 3
    })

    cursorY = Math.max(...columnCursor)
  })

  doc.save(`distribucion-habitaciones-${new Date().toISOString().slice(0, 10)}.pdf`)
}
