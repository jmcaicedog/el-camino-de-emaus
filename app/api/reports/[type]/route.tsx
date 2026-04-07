import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import ExcelJS from "exceljs"
import { formatPersonName, uiAvatarUrl } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "excel"
    const paperParam = (searchParams.get("paper") || "legal").toLowerCase()
    const orientationParam = (searchParams.get("orientation") || "portrait").toLowerCase()

    const paperSize = paperParam === "a4" || paperParam === "letter" || paperParam === "legal" ? paperParam : "legal"
    const orientation = orientationParam === "landscape" ? "landscape" : "portrait"

    const supabase = await createClient()

    if (type === "evolucion-mesas" || type === "caminantes-roncan") {
      const { data: userData } = await supabase.auth.getUser()
      const currentUser = userData?.user
      if (!currentUser) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

      const { data: adminRecord } = await supabase
        .from("admin_users")
        .select("is_super")
        .eq("id", currentUser.id)
        .maybeSingle()

      if (!adminRecord?.is_super) {
        const { data: servidorRecord } = await supabase
          .from("servidores")
          .select("id")
          .eq("auth_user_id", currentUser.id)
          .maybeSingle()

        let isLogisticaTeam = false
        if (servidorRecord?.id) {
          const { data: relaciones } = await supabase
            .from("servidor_equipo")
            .select("equipos(nombre)")
            .eq("servidor_id", servidorRecord.id)

          isLogisticaTeam =
            (relaciones || []).some((r: any) =>
              String(r?.equipos?.nombre || "").toLowerCase().includes("log"),
            )
        }

        const canAccess = type === "caminantes-roncan" ? isLogisticaTeam : false
        if (!canAccess) {
          return NextResponse.json({ message: "No autorizado" }, { status: 403 })
        }
      }
    }

  let data: any[] = []
  let columns: { key: string; label: string }[] = []
  let title = ""

    switch (type) {
      case "caminantes": {
        const mesaParam = searchParams.get("mesa")
        let query = supabase.from("caminantes").select("*").order("nombre_completo")
        if (mesaParam) {
          query = query.eq("mesa_id", mesaParam)
        }
        const { data: caminantes } = await query
        data = caminantes || []
        title = "Reporte de Caminantes"
        // Mostrar solo los campos relevantes y completos
        columns = [
          { key: "nombre_completo", label: "Nombre completo" },
          { key: "cedula", label: "Cédula" },
          { key: "edad", label: "Edad" },
          { key: "correo", label: "Correo" },
          { key: "celular", label: "Teléfono" },
          { key: "direccion", label: "Dirección" },
          { key: "ciudad", label: "Ciudad" },
          { key: "estado_civil", label: "Estado civil" },
          { key: "profesion", label: "Profesión" },
          { key: "empresa", label: "Empresa" },
          { key: "cargo", label: "Cargo" },
          { key: "nombre_contacto_emergencia", label: "Contacto emergencia 1" },
          { key: "parentesco_contacto", label: "Parentesco contacto 1" },
          { key: "celular_contacto", label: "Celular contacto 1" },
          { key: "nombre_contacto_emergencia_2", label: "Contacto emergencia 2" },
          { key: "parentesco_contacto_2", label: "Parentesco contacto 2" },
          { key: "celular_contacto_2", label: "Celular contacto 2" },
          { key: "restricciones_alimenticias", label: "Restricciones alimenticias" },
          { key: "medicamentos", label: "Medicamentos" },
          { key: "condicion_especial", label: "Condición especial" },
          { key: "eps", label: "EPS" },
          { key: "tipo_sangre", label: "Tipo de sangre" },
          { key: "ronca_al_dormir", label: "¿Ronca al dormir?" },
          { key: "talla_camisa", label: "Talla de camisa" },
          { key: "sacramentos_recibidos", label: "Sacramentos recibidos" },
          { key: "es_sorpresa", label: "¿Es sorpresa?" },
          { key: "quien_invito", label: "¿Quién lo invitó?" },
          { key: "invitador_hizo_retiro", label: "¿El invitador ya hizo el retiro?" },
          { key: "observaciones", label: "Observaciones" },
          { key: "cartas_recibidas", label: "Cartas recibidas" },
          { key: "fotos_recibidas", label: "Fotos recibidas" },
        ];
        break
      }

      case "caminantes-roncan": {
        const { data: caminantes } = await supabase
          .from("caminantes")
          .select("nombre_completo, edad, mesa_id, ronca_al_dormir")
          .eq("ronca_al_dormir", true)
          .order("nombre_completo")

        const { data: mesas } = await supabase.from("mesas").select("id, numero")
        const mesaById = new Map((mesas || []).map((mesa) => [mesa.id, mesa.numero]))

        data = (caminantes || [])
          .map((c) => ({
            nombre_completo: c.nombre_completo,
            edad: c.edad,
            mesa_numero: c.mesa_id ? mesaById.get(c.mesa_id) ?? "Sin mesa" : "Sin mesa",
            ronca_al_dormir: c.ronca_al_dormir ? "Sí" : "No",
          }))
          .sort((a, b) => {
            const mesaA = typeof a.mesa_numero === "number" ? a.mesa_numero : Number.MAX_SAFE_INTEGER
            const mesaB = typeof b.mesa_numero === "number" ? b.mesa_numero : Number.MAX_SAFE_INTEGER

            if (mesaA !== mesaB) return mesaA - mesaB
            return String(a.nombre_completo).localeCompare(String(b.nombre_completo), "es")
          })

        columns = [
          { key: "nombre_completo", label: "Nombre completo" },
          { key: "edad", label: "Edad" },
          { key: "mesa_numero", label: "Mesa" },
          { key: "ronca_al_dormir", label: "¿Ronca al dormir?" },
        ]
        title = "Caminantes que roncan"
        break
      }

      case "servidores": {
        const { data: servidores } = await supabase
          .from("servidores")
          .select("id, nombre_completo, mesa_id, monto_pagado, monto_total")
          .order("nombre_completo")
        const { data: relaciones } = await supabase
          .from("servidor_equipo")
          .select("servidor_id, equipo_id")
        const { data: equipos } = await supabase
          .from("equipos")
          .select("id, nombre")
        const { data: mesas } = await supabase
          .from("mesas")
          .select("id, numero")

        const equipoById = new Map((equipos || []).map((e) => [e.id, e.nombre]))
        const mesaById = new Map((mesas || []).map((m) => [m.id, m.numero]))
        const equiposPorServidor = new Map<string, string[]>()

        for (const rel of relaciones || []) {
          const nombreEquipo = equipoById.get(rel.equipo_id)
          if (!nombreEquipo) continue
          const arr = equiposPorServidor.get(rel.servidor_id) || []
          arr.push(String(nombreEquipo))
          equiposPorServidor.set(rel.servidor_id, arr)
        }

        data = (servidores || []).map((s) => {
          const pagado = Number(s.monto_pagado) || 0
          const total = Number(s.monto_total) || 0
          const equiposServidor = (equiposPorServidor.get(s.id) || []).sort((a, b) => a.localeCompare(b, "es"))

          return {
            nombre: s.nombre_completo,
            equipo: equiposServidor.length ? equiposServidor.join(", ") : "Sin equipo",
            mesa: s.mesa_id ? `Mesa ${mesaById.get(s.mesa_id) ?? "N/A"}` : "Sin mesa",
            pago: `$${pagado.toLocaleString("es-CO")} / $${total.toLocaleString("es-CO")}`,
          }
        })

        columns = [
          { key: "nombre", label: "Nombre" },
          { key: "equipo", label: "Equipo" },
          { key: "mesa", label: "Mesa" },
          { key: "pago", label: "Pago" },
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
        const { data: mesas } = await supabase.from("mesas").select("id, numero")
        const mesaById = new Map((mesas || []).map((mesa) => [mesa.id, mesa.numero]))

        data = [
          ...(caminantes?.filter((c) => c.medicamentos || c.restricciones_alimenticias || c.condicion_especial).map((c) => ({
            tipo: "Caminante",
            mesa_numero: c.mesa_id ? mesaById.get(c.mesa_id) ?? "Sin mesa" : "Sin mesa",
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
            mesa_numero: "N/A",
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
          { key: "mesa_numero", label: "Mesa #" },
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

      case "evolucion-mesas": {
        const TARGET_MESA_PAYMENT = 490000
        const { data: mesas } = await supabase.from("mesas").select("id, numero").order("numero")
        const { data: caminantes } = await supabase
          .from("caminantes")
          .select("mesa_id, nombre_completo, cartas_recibidas, monto_pagado, caminantes_contactados, familiares_contactados")

        const caminantesByMesa = new Map<string, any[]>()
        for (const caminante of caminantes || []) {
          if (!caminante.mesa_id) continue
          const arr = caminantesByMesa.get(caminante.mesa_id) || []
          arr.push(caminante)
          caminantesByMesa.set(caminante.mesa_id, arr)
        }

        data = (mesas || []).map((mesa) => {
          const mesaCaminantes = caminantesByMesa.get(mesa.id) || []
          const totalCaminantes = mesaCaminantes.length

          let progresoContacto = 0
          let progresoCartas = 0
          let progresoPagos = 0

          if (totalCaminantes > 0) {
            const totalContactoPuntos = totalCaminantes * 2
            let puntosContacto = 0
            let caminantesConCartas = 0
            let totalPagado = 0

            for (const c of mesaCaminantes) {
              if (c.caminantes_contactados) puntosContacto += 1
              if (c.familiares_contactados) puntosContacto += 1
              if ((c.cartas_recibidas ?? 0) > 0) caminantesConCartas += 1
              totalPagado += Math.min(Number(c.monto_pagado) || 0, TARGET_MESA_PAYMENT)
            }

            progresoContacto = (puntosContacto / totalContactoPuntos) * 100
            progresoCartas = (caminantesConCartas / totalCaminantes) * 100
            progresoPagos = (totalPagado / (totalCaminantes * TARGET_MESA_PAYMENT)) * 100
          }

          const detalleCaminantes = mesaCaminantes.length
            ? mesaCaminantes
                .map(
                  (c) =>
                    `${c.nombre_completo} | Cartas: ${c.cartas_recibidas ?? 0} | Pagado: $${Number(c.monto_pagado || 0).toLocaleString("es-CO")}`,
                )
                .join("\n")
            : "Sin caminantes asignados"

          return {
            mesa_numero: mesa.numero,
            avance_contacto: Number(progresoContacto.toFixed(2)),
            avance_cartas: Number(progresoCartas.toFixed(2)),
            avance_pagos: Number(progresoPagos.toFixed(2)),
            caminantes_detalle: detalleCaminantes,
          }
        })

        columns = [
          { key: "mesa_numero", label: "Mesa" },
          { key: "avance_contacto", label: "% Avance Contacto" },
          { key: "avance_cartas", label: "% Avance Cartas" },
          { key: "avance_pagos", label: "% Avance Pagos" },
          { key: "caminantes_detalle", label: "Caminantes (Nombre | Cartas | Pagado)" },
        ]

        title = "Evolución de mesas"
        break
      }

      default:
        return NextResponse.json({ message: "Tipo de reporte no válido" }, { status: 400 })
    }

    data = normalizeReportNames(data)

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
      let html = '';
      if (type === "caminantes") {
        html = generateFichaHTML(data, title, paperSize, orientation);
      } else if (type === "servidores") {
        html = generateHTML(data, columns, title);
      } else {
        html = generateHTML(data, columns, title);
      }
      // Genera HTML tipo ficha por servidor, una por página, con sombra y formato fácil de imprimir
      function generateFichaServidoresHTML(data: any[], title: string): string {
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(title)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              h1 { color: #333; }
              .header { margin-bottom: 20px; }
              .date { color: #666; font-size: 14px; }
              .ficha {
                background: #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                border-radius: 10px;
                padding: 24px 32px;
                margin-bottom: 40px;
                page-break-after: always;
                max-width: 800px;
                margin-left: auto;
                margin-right: auto;
              }
              .ficha:last-child { page-break-after: auto; }
              .campo {
                display: flex;
                margin-bottom: 8px;
              }
              .campo-label {
                width: 220px;
                font-weight: bold;
                color: #444;
              }
              .campo-valor {
                flex: 1;
                color: #222;
              }
              @media print {
                button { display: none; }
                body { background: #fff; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${escapeHtml(title)}</h1>
              <p class="date">Fecha: ${new Date().toLocaleDateString("es-CO")}</p>
              <button onclick="window.print()">Imprimir / Guardar como PDF</button>
            </div>
            ${data.map((servidor, idx) => `
              <div class="ficha">
                <h2 style="margin-top:0;margin-bottom:18px;">Servidor #${idx + 1}</h2>
                ${renderCampo('Nombre completo', servidor.nombre_completo)}
                ${renderCampo('Cédula', servidor.cedula)}
                ${renderCampo('Edad', servidor.edad)}
                ${renderCampo('Correo', servidor.correo)}
                ${renderCampo('Teléfono', servidor.celular)}
                ${renderCampo('Dirección', servidor.direccion)}
                ${renderCampo('Ciudad', servidor.ciudad)}
                ${renderCampo('Estado civil', servidor.estado_civil)}
                ${renderCampo('Profesión', servidor.profesion)}
                ${renderCampo('Empresa', servidor.empresa)}
                ${renderCampo('Cargo', servidor.cargo)}
                ${renderCampo('Tipo de servidor', servidor.tipo_servidor)}
                ${renderCampo('Mesa', servidor.mesa_id)}
                ${renderCampo('Contacto emergencia 1', servidor.nombre_contacto_emergencia)}
                ${renderCampo('Parentesco contacto 1', servidor.parentesco_contacto)}
                ${renderCampo('Celular contacto 1', servidor.celular_contacto)}
                ${renderCampo('Contacto emergencia 2', servidor.nombre_contacto_emergencia_2)}
                ${renderCampo('Parentesco contacto 2', servidor.parentesco_contacto_2)}
                ${renderCampo('Celular contacto 2', servidor.celular_contacto_2)}
                ${renderCampo('Restricciones alimenticias', servidor.restricciones_alimenticias)}
                ${renderCampo('Medicamentos', servidor.medicamentos)}
                ${renderCampo('Condición especial', servidor.condicion_especial)}
                ${renderCampo('EPS', servidor.eps)}
                ${renderCampo('Tipo de sangre', servidor.tipo_sangre)}
                ${renderCampo('¿Ronca al dormir?', servidor.ronca_al_dormir ? 'Sí' : 'No')}
                ${renderCampo('Talla de camisa', servidor.talla_camisa)}
                ${renderCampo('Colores de camisa', Array.isArray(servidor.colores_camisa) ? servidor.colores_camisa.join(', ') : servidor.colores_camisa)}
                ${renderCampo('¿Es super admin?', servidor.is_super_admin ? 'Sí' : 'No')}
                ${renderCampo('Observaciones', servidor.observaciones)}
              </div>
            `).join('')}
          </body>
          </html>
        `;
      }
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }
  // Genera HTML tipo ficha por caminante, una por página, con sombra y formato fácil de imprimir
  function generateFichaHTML(data: any[], title: string, paperSize: "a4" | "letter" | "legal", orientation: "portrait" | "landscape"): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: 12mm;
          }
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          h1 { color: #333; }
          .header { margin-bottom: 20px; }
          .date { color: #666; font-size: 14px; }
          .ficha {
            background: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            border-radius: 10px;
            padding: 24px 32px;
            margin-bottom: 40px;
            page-break-after: always;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            page-break-inside: avoid;
            break-inside: avoid-page;
          }
          .ficha:last-child { page-break-after: auto; }
          .ficha-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 18px;
          }
          .ficha-avatar {
            width: 80px;
            height: 80px;
            border-radius: 9999px;
            object-fit: cover;
            border: 2px solid #e5e7eb;
            flex-shrink: 0;
          }
          .ficha-title {
            margin: 0;
          }
          .campo {
            display: flex;
            margin-bottom: 8px;
          }
          .campo-label {
            width: 220px;
            font-weight: bold;
            color: #444;
          }
          .campo-valor {
            flex: 1;
            color: #222;
          }
          @media print {
            button { display: none; }
            body { background: #fff; }
            .ficha {
              box-shadow: none;
              border: 1px solid #ddd;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHtml(title)}</h1>
          <p class="date">Fecha: ${new Date().toLocaleDateString("es-CO")}</p>
          <button onclick="window.print()">Imprimir / Guardar como PDF</button>
        </div>
        ${data.map((caminante, idx) => `
          <div class="ficha">
            <div class="ficha-header">
              <img
                class="ficha-avatar"
                src="${escapeHtml(String(caminante.imagen || uiAvatarUrl(caminante.nombre_completo || "Caminante", 256)))}"
                alt="Foto de ${escapeHtml(String(caminante.nombre_completo || "Caminante"))}"
              />
              <h2 class="ficha-title">Caminante #${idx + 1}</h2>
            </div>
            ${renderCampo('Nombre completo', caminante.nombre_completo)}
            ${renderCampo('Cédula', caminante.cedula)}
            ${renderCampo('Edad', caminante.edad)}
            ${renderCampo('Correo', caminante.correo)}
            ${renderCampo('Teléfono', caminante.celular)}
            ${renderCampo('Dirección', caminante.direccion)}
            ${renderCampo('Ciudad', caminante.ciudad)}
            ${renderCampo('Estado civil', caminante.estado_civil)}
            ${renderCampo('Profesión', caminante.profesion)}
            ${renderCampo('Empresa', caminante.empresa)}
            ${renderCampo('Cargo', caminante.cargo)}
            ${renderCampo('Contacto emergencia 1', caminante.nombre_contacto_emergencia)}
            ${renderCampo('Parentesco contacto 1', caminante.parentesco_contacto)}
            ${renderCampo('Celular contacto 1', caminante.celular_contacto)}
            ${renderCampo('Contacto emergencia 2', caminante.nombre_contacto_emergencia_2)}
            ${renderCampo('Parentesco contacto 2', caminante.parentesco_contacto_2)}
            ${renderCampo('Celular contacto 2', caminante.celular_contacto_2)}
            ${renderCampo('Restricciones alimenticias', caminante.restricciones_alimenticias)}
            ${renderCampo('Medicamentos', caminante.medicamentos)}
            ${renderCampo('Condición especial', caminante.condicion_especial)}
            ${renderCampo('EPS', caminante.eps)}
            ${renderCampo('Tipo de sangre', caminante.tipo_sangre)}
            ${renderCampo('¿Ronca al dormir?', caminante.ronca_al_dormir ? 'Sí' : 'No')}
            ${renderCampo('Talla de camisa', caminante.talla_camisa)}
            ${renderCampo('Sacramentos recibidos', Array.isArray(caminante.sacramentos_recibidos) ? caminante.sacramentos_recibidos.join(', ') : caminante.sacramentos_recibidos)}
            ${renderCampo('¿Es sorpresa?', caminante.es_sorpresa ? 'Sí' : 'No')}
            ${renderCampo('¿Quién lo invitó?', caminante.quien_invito)}
            ${renderCampo('¿El invitador ya hizo el retiro?', caminante.invitador_hizo_retiro === true ? 'Sí' : caminante.invitador_hizo_retiro === false ? 'No' : '-')}
            ${renderCampo('Observaciones', caminante.observaciones)}
            ${renderCampo('Cartas recibidas', caminante.cartas_recibidas)}
            ${renderCampo('Fotos recibidas', caminante.fotos_recibidas)}
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }

  function renderCampo(label: string, valor: any) {
    if (valor === undefined || valor === null || valor === "") return "";
    return `<div class="campo"><div class="campo-label">${escapeHtml(label)}:</div><div class="campo-valor">${escapeHtml(String(valor))}</div></div>`;
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

function normalizeReportNames(data: any[]): any[] {
  return (data || []).map((row) => {
    const normalized = { ...row }

    if (typeof normalized.nombre_completo === "string") {
      normalized.nombre_completo = formatPersonName(normalized.nombre_completo)
    }

    if (typeof normalized.nombre === "string") {
      normalized.nombre = formatPersonName(normalized.nombre)
    }

    if (Array.isArray(normalized.caminantes)) {
      normalized.caminantes = normalized.caminantes.map((name: any) =>
        typeof name === "string" ? formatPersonName(name) : name,
      )
    }

    if (Array.isArray(normalized.servidores)) {
      normalized.servidores = normalized.servidores.map((name: any) =>
        typeof name === "string" ? formatPersonName(name) : name,
      )
    }

    if (typeof normalized.servidores === "string" && normalized.servidores.includes("\n")) {
      normalized.servidores = normalized.servidores
        .split("\n")
        .map((line: string) => formatPersonName(line.trim()))
        .join("\n")
    }

    if (typeof normalized.caminantes_detalle === "string" && normalized.caminantes_detalle.includes("\n")) {
      normalized.caminantes_detalle = normalized.caminantes_detalle
        .split("\n")
        .map((line: string) => {
          const parts = line.split("|")
          if (parts.length === 0) return line
          const formattedName = formatPersonName(parts[0].trim())
          if (parts.length === 1) return formattedName
          return `${formattedName} | ${parts.slice(1).join("|").trim()}`
        })
        .join("\n")
    }

    return normalized
  })
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
