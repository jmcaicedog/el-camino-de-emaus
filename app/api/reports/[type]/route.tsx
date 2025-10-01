import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "excel"

    const supabase = await createClient()

    let data: any[] = []
    let headers: string[] = []
    let title = ""

    switch (type) {
      case "caminantes": {
        const { data: caminantes } = await supabase.from("caminantes").select("*").order("nombre_completo")
        data = caminantes || []
        headers = [
          "Nombre",
          "Cédula",
          "Edad",
          "Celular",
          "Correo",
          "Ciudad",
          "Estado Civil",
          "Profesión",
          "EPS",
          "Tipo Sangre",
          "Parroquia",
          "Monto Total",
          "Monto Pagado",
          "Saldo",
        ]
        title = "Reporte de Caminantes"
        break
      }

      case "servidores": {
        const { data: servidores } = await supabase.from("servidores").select("*").order("nombre_completo")
        data = servidores || []
        headers = [
          "Nombre",
          "Cédula",
          "Edad",
          "Celular",
          "Correo",
          "Ciudad",
          "Tipo Servidor",
          "Retiros Anteriores",
          "Monto Total",
          "Monto Pagado",
          "Saldo",
        ]
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

        headers = ["Número", "Nombre", "Caminantes", "Servidores"]
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

        headers = ["Tipo", "Nombre", "Cédula", "Monto Total", "Monto Pagado", "Saldo"]
        title = "Reporte de Pagos"
        break
      }

      default:
        return NextResponse.json({ message: "Tipo de reporte no válido" }, { status: 400 })
    }

    if (format === "excel") {
      const csv = generateCSV(data, headers, type)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else {
      const html = generateHTML(data, headers, title, type)
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
        },
      })
    }
  } catch (error) {
    console.error("[v0] Error generating report:", error)
    return NextResponse.json({ message: "Error al generar el reporte" }, { status: 500 })
  }
}

function generateCSV(data: any[], headers: string[], type: string): string {
  const rows: string[][] = [headers]

  data.forEach((item) => {
    let row: string[] = []

    switch (type) {
      case "caminantes":
        row = [
          item.nombre_completo,
          item.cedula,
          item.edad?.toString() || "",
          item.celular,
          item.correo,
          item.ciudad,
          item.estado_civil,
          item.profesion,
          item.eps,
          item.tipo_sangre,
          item.parroquia,
          item.monto_total?.toString() || "0",
          item.monto_pagado?.toString() || "0",
          (item.monto_total - item.monto_pagado)?.toString() || "0",
        ]
        break

      case "servidores":
        row = [
          item.nombre_completo,
          item.cedula,
          item.edad?.toString() || "",
          item.celular,
          item.correo,
          item.ciudad,
          item.tipo_servidor || "",
          item.retiros_anteriores?.toString() || "0",
          item.monto_total?.toString() || "0",
          item.monto_pagado?.toString() || "0",
          (item.monto_total - item.monto_pagado)?.toString() || "0",
        ]
        break

      case "mesas":
        row = [
          item.numero?.toString() || "",
          item.nombre || "",
          item.caminantes?.join(", ") || "",
          item.servidores?.join(", ") || "",
        ]
        break

      case "pagos":
        row = [
          item.tipo,
          item.nombre,
          item.cedula,
          item.monto_total?.toString() || "0",
          item.monto_pagado?.toString() || "0",
          item.saldo?.toString() || "0",
        ]
        break
    }

    rows.push(row)
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

function generateHTML(data: any[], headers: string[], title: string, type: string): string {
  let tableRows = ""

  data.forEach((item) => {
    let cells = ""

    switch (type) {
      case "caminantes":
        cells = `
          <td>${item.nombre_completo}</td>
          <td>${item.cedula}</td>
          <td>${item.edad || ""}</td>
          <td>${item.celular}</td>
          <td>${item.correo}</td>
          <td>${item.ciudad}</td>
          <td>${item.estado_civil}</td>
          <td>${item.profesion}</td>
          <td>${item.eps}</td>
          <td>${item.tipo_sangre}</td>
          <td>${item.parroquia}</td>
          <td>$${item.monto_total?.toLocaleString() || "0"}</td>
          <td>$${item.monto_pagado?.toLocaleString() || "0"}</td>
          <td>$${(item.monto_total - item.monto_pagado)?.toLocaleString() || "0"}</td>
        `
        break

      case "servidores":
        cells = `
          <td>${item.nombre_completo}</td>
          <td>${item.cedula}</td>
          <td>${item.edad || ""}</td>
          <td>${item.celular}</td>
          <td>${item.correo}</td>
          <td>${item.ciudad}</td>
          <td>${item.tipo_servidor || ""}</td>
          <td>${item.retiros_anteriores || "0"}</td>
          <td>$${item.monto_total?.toLocaleString() || "0"}</td>
          <td>$${item.monto_pagado?.toLocaleString() || "0"}</td>
          <td>$${(item.monto_total - item.monto_pagado)?.toLocaleString() || "0"}</td>
        `
        break

      case "mesas":
        cells = `
          <td>${item.numero || ""}</td>
          <td>${item.nombre || ""}</td>
          <td>${item.caminantes?.join(", ") || ""}</td>
          <td>${item.servidores?.join(", ") || ""}</td>
        `
        break

      case "pagos":
        cells = `
          <td>${item.tipo}</td>
          <td>${item.nombre}</td>
          <td>${item.cedula}</td>
          <td>$${item.monto_total?.toLocaleString() || "0"}</td>
          <td>$${item.monto_pagado?.toLocaleString() || "0"}</td>
          <td>$${item.saldo?.toLocaleString() || "0"}</td>
        `
        break
    }

    tableRows += `<tr>${cells}</tr>`
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
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
        <h1>${title}</h1>
        <p class="date">Fecha: ${new Date().toLocaleDateString("es-CO")}</p>
        <button onclick="window.print()">Imprimir / Guardar como PDF</button>
      </div>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `
}
