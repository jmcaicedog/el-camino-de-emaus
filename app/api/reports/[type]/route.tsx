import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "excel"

    const supabase = await createClient()

  let data: any[] = []
  let columns: { key: string; label: string }[] = []
  let title = ""

    switch (type) {
      case "caminantes": {
        const { data: caminantes } = await supabase.from("caminantes").select("*").order("nombre_completo")
        data = caminantes || []
        title = "Reporte de Caminantes"
        // If we have data, build columns dynamically to include all fields
        if (data.length > 0) {
          columns = Object.keys(data[0]).map((k) => ({ key: k, label: humanize(k) }))
        } else {
          columns = [
            { key: "nombre_completo", label: "Nombre" },
            { key: "cedula", label: "Cédula" },
          ]
        }
        title = "Reporte de Caminantes"
        break
      }

      case "servidores": {
        const { data: servidores } = await supabase.from("servidores").select("*").order("nombre_completo")
        data = servidores || []
        if (data.length > 0) {
          columns = Object.keys(data[0]).map((k) => ({ key: k, label: humanize(k) }))
        } else {
          columns = [
            { key: "nombre_completo", label: "Nombre" },
            { key: "cedula", label: "Cédula" },
          ]
        }
        title = "Reporte de Servidores"
        break
      }

      case "mesas": {
        const { data: mesas } = await supabase.from("mesas").select("*").order("numero")
        const { data: caminantes } = await supabase.from("caminantes").select("*")
        const { data: servidores } = await supabase.from("servidores").select("*")

        data =
          mesas?.map((mesa) => ({
            numero: mesa.numero,
            nombre: mesa.nombre,
            caminantes: caminantes?.filter((c) => c.mesa_id === mesa.id).map((c) => c.nombre_completo) || [],
            servidores: servidores?.filter((s) => s.mesa_id === mesa.id).map((s) => s.nombre_completo) || [],
          })) || []
        columns = [
          { key: "numero", label: "Número" },
          { key: "nombre", label: "Nombre" },
          { key: "caminantes", label: "Caminantes" },
          { key: "servidores", label: "Servidores" },
        ]
        title = "Reporte de Mesas"
        break
      }

      case "pagos": {
        const { data: caminantes } = await supabase.from("caminantes").select("*").order("nombre_completo")
        const { data: servidores } = await supabase.from("servidores").select("*").order("nombre_completo")

        data = [
          ...(caminantes?.map((c) => ({
            tipo: "Caminante",
            nombre: c.nombre_completo,
            cedula: c.cedula,
            monto_total: c.monto_total,
            monto_pagado: c.monto_pagado,
            saldo: c.monto_total - c.monto_pagado,
          })) || []),
          ...(servidores?.map((s) => ({
            tipo: "Servidor",
            nombre: s.nombre_completo,
            cedula: s.cedula,
            monto_total: s.monto_total,
            monto_pagado: s.monto_pagado,
            saldo: s.monto_total - s.monto_pagado,
          })) || []),
        ]
        columns = [
          { key: "tipo", label: "Tipo" },
          { key: "nombre", label: "Nombre" },
          { key: "cedula", label: "Cédula" },
          { key: "monto_total", label: "Monto Total" },
          { key: "monto_pagado", label: "Monto Pagado" },
          { key: "saldo", label: "Saldo" },
        ]
        title = "Reporte de Pagos"
        break
      }

      case "cartas": {
        const { data: mesas } = await supabase.from("mesas").select("*").order("numero")
        const { data: caminantes } = await supabase.from("caminantes").select("*").order("nombre_completo")

        data = []
        for (const mesa of mesas || []) {
          const caminantesMesa = caminantes?.filter((c) => c.mesa_id === mesa.id) || []
          for (const caminante of caminantesMesa) {
            data.push({
              mesa_numero: mesa.numero,
              mesa_nombre: mesa.nombre,
              nombre_completo: caminante.nombre_completo,
              cartas_recibidas: caminante.cartas_recibidas || 0,
              fotos_recibidas: caminante.fotos_recibidas || 0,
            })
          }
        }
        columns = [
          { key: "mesa_numero", label: "Mesa #" },
          { key: "mesa_nombre", label: "Nombre Mesa" },
          { key: "nombre_completo", label: "Caminante" },
          { key: "cartas_recibidas", label: "Cartas" },
          { key: "fotos_recibidas", label: "Fotos" },
        ]
        title = "Cartas de Caminantes por Mesa"
        break
      }

      case "restricciones": {
        const { data: caminantes } = await supabase.from("caminantes").select("*").order("nombre_completo")
        const { data: servidores } = await supabase.from("servidores").select("*").order("nombre_completo")

        data = [
          ...(caminantes?.filter((c) => c.medicamentos || c.restricciones_alimenticias || c.condicion_especial).map((c) => ({
            tipo: "Caminante",
            nombre: c.nombre_completo,
            celular: c.celular,
            eps: c.eps,
            tipo_sangre: c.tipo_sangre,
            medicamentos: c.medicamentos || "Ninguno",
            restricciones_alimenticias: c.restricciones_alimenticias || "Ninguna",
            condicion_especial: c.condicion_especial || "Ninguna",
          })) || []),
          ...(servidores?.filter((s) => s.medicamentos || s.restricciones_alimenticias || s.condicion_especial).map((s) => ({
            tipo: "Servidor",
            nombre: s.nombre_completo,
            celular: s.celular,
            eps: s.eps,
            tipo_sangre: s.tipo_sangre,
            medicamentos: s.medicamentos || "Ninguno",
            restricciones_alimenticias: s.restricciones_alimenticias || "Ninguna",
            condicion_especial: s.condicion_especial || "Ninguna",
          })) || []),
        ]
        columns = [
          { key: "tipo", label: "Tipo" },
          { key: "nombre", label: "Nombre" },
          { key: "celular", label: "Celular" },
          { key: "eps", label: "EPS" },
          { key: "tipo_sangre", label: "Tipo de Sangre" },
          { key: "medicamentos", label: "Medicamentos" },
          { key: "restricciones_alimenticias", label: "Restricciones Alimenticias" },
          { key: "condicion_especial", label: "Condición Especial" },
        ]
        title = "Restricciones Alimenticias y Medicamentos"
        break
      }

      case "equipos-servidores": {
        const { data: equipos } = await supabase.from("equipos").select("*").order("nombre")
        const { data: relaciones } = await supabase.from("servidor_equipo").select("servidor_id, equipo_id")
        const { data: servidores } = await supabase.from("servidores").select("id, nombre_completo, tipo_servidor")

        data = []
        for (const equipo of equipos || []) {
          let nombresServidores: string[] = []
          
          // Si es el equipo de Líderes y colíderes, incluir todos los que tienen tipo_servidor
          if (equipo.nombre === "Líderes y colíderes") {
            nombresServidores = servidores
              ?.filter(s => s.tipo_servidor === "lider" || s.tipo_servidor === "colider")
              .map(s => s.nombre_completo) || []
          } else {
            // Para otros equipos, usar la relación de servidor_equipo
            const servidoresEquipo = relaciones?.filter(r => r.equipo_id === equipo.id) || []
            nombresServidores = servidoresEquipo
              .map(rel => servidores?.find(s => s.id === rel.servidor_id)?.nombre_completo)
              .filter(Boolean) as string[]
          }
          
          data.push({
            equipo: equipo.nombre,
            servidores: nombresServidores.length > 0 ? nombresServidores.join("\n") : "Sin servidores asignados",
          })
        }
        columns = [
          { key: "equipo", label: "Equipo" },
          { key: "servidores", label: "Servidores" },
        ]
        title = "Equipos y Servidores"
        break
      }

      case "tallas": {
        const { data: caminantes } = await supabase.from("caminantes").select("nombre_completo, talla_camisa").order("nombre_completo")

        data = [
          ...(caminantes?.map((c) => ({
            tipo: "Caminante",
            nombre: c.nombre_completo,
            talla: c.talla_camisa || "Sin especificar",
          })) || []),
        ]
        columns = [
          { key: "tipo", label: "Tipo" },
          { key: "nombre", label: "Nombre" },
          { key: "talla", label: "Talla de Camiseta" },
        ]
        title = "Tallas de Camiseta (Caminantes)"
        break
      }

      case "tallas-servidores": {
        // Mostrar sólo servidores que marcaron al menos un color y listar esos colores
        const { data: servidores } = await supabase
          .from("servidores")
          .select("nombre_completo, talla_camisa, colores_camisa")
          .order("nombre_completo")

        const servidoresConColores = (servidores || []).filter(
          (s: any) => Array.isArray(s.colores_camisa) && s.colores_camisa.length > 0
        )

        data = servidoresConColores.map((s: any) => ({
          nombre: s.nombre_completo,
          talla: s.talla_camisa || "Sin especificar",
          colores: (s.colores_camisa || []).join(", "),
        }))

        columns = [
          { key: "nombre", label: "Nombre" },
          { key: "talla", label: "Talla de Camiseta" },
          { key: "colores", label: "Colores de Camiseta" },
        ]

        title = "Tallas y Colores (Servidores)"
        break
      }

      default:
        return NextResponse.json({ message: "Tipo de reporte no válido" }, { status: 400 })
    }

    if (format === "excel") {
      try {
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet(title || "Reporte")

        // Add header row
        sheet.addRow(columns.map((c) => c.label))
        // Bold header
        const headerRow = sheet.getRow(1)
        headerRow.font = { bold: true }

        // Add data rows with typed values so Excel recognizes numbers/dates
        data.forEach((item) => {
          const typedRow = columns.map((col) => {
            const v = item[col.key]
            if (v === null || v === undefined) return ""

            // Handle arrays and objects
            if (Array.isArray(v)) return v.join(", ")
            if (typeof v === "object") return JSON.stringify(v)

            // Detect numeric values
            if (typeof v === "number") return v
            if (typeof v === "string") {
              const maybeNumber = Number(v)
              if (!Number.isNaN(maybeNumber) && String(maybeNumber) === v.trim()) return maybeNumber

              // Detect ISO date strings
              const maybeDate = new Date(v)
              if (!Number.isNaN(maybeDate.getTime()) && /\d{4}-\d{2}-\d{2}/.test(v)) return maybeDate

              return v
            }

            return String(v)
          })
          sheet.addRow(typedRow)
        })

        // Simple formatting: set column widths and number/date formats when applicable
        sheet.columns.forEach((col, idx) => {
          try {
            // calculate max length
            let maxLength = 10
            if (col && typeof (col as any).eachCell === "function") {
              ;(col as any).eachCell({ includeEmpty: true }, (cell: any) => {
                const len = cell && cell.value ? String(cell.value).length : 0
                if (len > maxLength) maxLength = len
              })
            }
            ;(col as any).width = Math.min(Math.max(maxLength + 2, 10), 80)

            // Determine the original key for this column
            const key = columns[idx] && columns[idx].key ? columns[idx].key.toLowerCase() : ""

            // Numeric/monetary columns
            if (/(monto|saldo|total|pagado|amount|price)/i.test(key)) {
              // Apply currency/number format
              ;(sheet.getColumn(idx + 1) as any).numFmt = '#,##0.00'
            }

            // Date-like columns
            if (/(fecha|date|created_at|updated_at)/i.test(key)) {
              ;(sheet.getColumn(idx + 1) as any).numFmt = 'dd/mm/yyyy'
            }
          } catch (e) {
            // ignore formatting errors
          }
        })

        const buffer = await workbook.xlsx.writeBuffer()

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().split("T")[0]}.xlsx"`,
          },
        })
      } catch (err) {
        console.error("Error generating xlsx, falling back to CSV:", err)
        const csv = generateCSV(data, columns)
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        })
      }
    } else {
      const html = generateHTML(data, columns, title)
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }
  } catch (error) {
    console.error("[v0] Error generating report:", error)
    return NextResponse.json({ message: "Error al generar el reporte" }, { status: 500 })
  }
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function generateCSV(data: any[], columns: { key: string; label: string }[]): string {
  const rows: string[][] = [columns.map((c) => c.label)]

  data.forEach((item) => {
    const row = columns.map((col) => `"${formatValue(item[col.key])}"`)
    rows.push(row)
  })

  // Prefix with UTF-8 BOM so Excel (Windows) detects UTF-8 encoding
  const csv = rows.map((row) => row.join(",")).join("\n")
  return "\uFEFF" + csv
}

function generateHTML(data: any[], columns: { key: string; label: string }[], title: string): string {
  let tableRows = ""

  data.forEach((item) => {
    const cells = columns
      .map((col) => {
        const value = formatValue(item[col.key])
        // Convertir saltos de línea a <br> para HTML
        const htmlValue = escapeHtml(value).replace(/\n/g, '<br>')
        return `<td>${htmlValue}</td>`
      })
      .join("")

    tableRows += `<tr>${cells}</tr>`
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <p class="date">Fecha: ${new Date().toLocaleDateString("es-CO")}</p>
        <button onclick="window.print()">Imprimir / Guardar como PDF</button>
      </div>
      <table>
        <thead>
          <tr>${columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `
}

function humanize(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
