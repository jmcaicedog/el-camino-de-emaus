import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { MinutoEvento } from "@/lib/types"
import type { RetiroDayInfo } from "./minuto-helpers"
import { formatISODate, formatTimeRange } from "./minuto-helpers"
import { getColorRGB } from "./minuto-colors"

export interface MinutoPdfColumns {
  descripcion: boolean
  requerimientos: boolean
  responsables: boolean
}

interface ExportMinutoPdfParams {
  eventos: MinutoEvento[]
  retiroDays: RetiroDayInfo[]
  selectedDayKey: "viernes" | "sabado" | "domingo" | "todos"
  columns: MinutoPdfColumns
}

function getResponsablesText(evento: MinutoEvento): string {
  const nombres = (evento.responsables || [])
    .map((r) => (r.tipo_responsable === "servidor" ? r.servidor?.nombre_completo : r.equipo?.nombre))
    .filter((n): n is string => Boolean(n))
  return nombres.length > 0 ? nombres.join(", ") : "—"
}

export function exportMinutoPDF({ eventos, retiroDays, selectedDayKey, columns }: ExportMinutoPdfParams) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 10

  const headers = ["Horario", "Actividad"]
  if (columns.descripcion) headers.push("Descripción")
  if (columns.requerimientos) headers.push("Requerimientos")
  if (columns.responsables) headers.push("Responsables")

  doc.setFontSize(15)
  doc.text("Minuto a Minuto", marginX, 15)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generado el ${new Date().toLocaleString("es-CO")}`, marginX, 21)
  doc.setTextColor(0)

  let cursorY = 27
  const daysToRender = retiroDays.filter((d) => selectedDayKey === "todos" || d.key === selectedDayKey)
  let isFirstRenderedDay = true

  daysToRender.forEach((day) => {
    const dayEvents = eventos
      .filter((ev) => formatISODate(new Date(ev.fecha_inicio)) === day.isoDate)
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())

    if (dayEvents.length === 0) return

    if (!isFirstRenderedDay) {
      doc.addPage()
      cursorY = 15
    }
    isFirstRenderedDay = false

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(day.fullLabel, marginX, cursorY)
    doc.setFont("helvetica", "normal")
    cursorY += 5

    const body = dayEvents.map((ev) => {
      const row = [formatTimeRange(ev.fecha_inicio, ev.fecha_fin), ev.titulo]
      if (columns.descripcion) row.push(ev.descripcion || "—")
      if (columns.requerimientos) row.push(ev.requerimientos || "—")
      if (columns.responsables) row.push(getResponsablesText(ev))
      return row
    })

    autoTable(doc, {
      head: [headers],
      body,
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: { top: 1.8, bottom: 1.8, left: 2.5, right: 2.5 },
        overflow: "linebreak",
        valign: "top",
        lineColor: [225, 225, 225],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: "bold" },
        1: { cellWidth: columns.descripcion || columns.requerimientos || columns.responsables ? 38 : pageWidth - 2 * marginX - 24 },
      },
      didParseCell: (data) => {
        if (data.section !== "body") return
        const evento = dayEvents[data.row.index]
        if (!evento) return
        const rgb = getColorRGB(evento.color)
        data.cell.styles.fillColor = rgb.fill
      },
      didDrawCell: (data) => {
        if (data.section !== "body" || data.column.index !== 0) return
        const evento = dayEvents[data.row.index]
        if (!evento) return
        const rgb = getColorRGB(evento.color)
        doc.setFillColor(rgb.border[0], rgb.border[1], rgb.border[2])
        doc.rect(data.cell.x, data.cell.y, 1.1, data.cell.height, "F")
      },
    })

    // @ts-expect-error lastAutoTable is attached by the plugin at runtime
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 8
  })

  const timestamp = new Date().toISOString().slice(0, 10)
  doc.save(`minuto-a-minuto_${timestamp}.pdf`)
}
