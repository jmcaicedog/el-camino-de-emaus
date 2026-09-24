import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { TurnoSantisimo } from "@/lib/types"
import { formatSantisimoTurn } from "@/lib/santisimo-turnos"

export function exportTurnosSantisimoPdf(turnos: TurnoSantisimo[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const sortedTurnos = [...turnos].sort((first, second) => {
    const dateDifference = new Date(first.turno_inicio).getTime() - new Date(second.turno_inicio).getTime()
    if (dateDifference !== 0) return dateDifference
    return (first.servidor?.nombre_completo || "").localeCompare(second.servidor?.nombre_completo || "", "es")
  })

  doc.setFontSize(16)
  doc.text("Turnos en el Santísimo", 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generado el ${new Date().toLocaleString("es-CO")}`, 14, 22)
  doc.setTextColor(0)

  autoTable(doc, {
    head: [["Servidor", "Día y hora"]],
    body: sortedTurnos.map((turno) => [
      turno.servidor?.nombre_completo || "Servidor",
      formatSantisimoTurn(turno.turno_inicio),
    ]),
    startY: 28,
    margin: { left: 14, right: 14 },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [225, 225, 225], lineWidth: 0.1 },
    headStyles: { fillColor: [120, 74, 39], textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 105 }, 1: { cellWidth: 63 } },
  })

  doc.save(`turnos-santisimo_${new Date().toISOString().slice(0, 10)}.pdf`)
}
