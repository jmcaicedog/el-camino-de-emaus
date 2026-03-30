import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { formatPersonName } from "@/lib/utils"

function buildWaitlistFormData(caminante: any) {
  return {
    nombre_completo: formatPersonName(caminante.nombre_completo),
    cedula: caminante.cedula,
    fecha_nacimiento: caminante.fecha_nacimiento,
    edad: caminante.edad,
    celular: caminante.celular,
    correo: String(caminante.correo || "").toLowerCase(),
    direccion: caminante.direccion,
    ciudad: caminante.ciudad,
    estado_civil: caminante.estado_civil,
    profesion: caminante.profesion,
    empresa: caminante.empresa,
    cargo: caminante.cargo,
    nombre_contacto_emergencia: caminante.nombre_contacto_emergencia,
    parentesco_contacto: caminante.parentesco_contacto,
    celular_contacto: caminante.celular_contacto,
    nombre_contacto_emergencia_2: caminante.nombre_contacto_emergencia_2,
    parentesco_contacto_2: caminante.parentesco_contacto_2,
    celular_contacto_2: caminante.celular_contacto_2,
    es_sorpresa: caminante.es_sorpresa,
    ronca_al_dormir: caminante.ronca_al_dormir,
    condicion_especial: caminante.condicion_especial,
    talla_camisa: caminante.talla_camisa,
    sacramentos_recibidos: caminante.sacramentos_recibidos,
    quien_invito: caminante.quien_invito,
    invitador_hizo_retiro: caminante.invitador_hizo_retiro,
    eps: caminante.eps,
    tipo_sangre: caminante.tipo_sangre,
    medicamentos: caminante.medicamentos,
    restricciones_alimenticias: caminante.restricciones_alimenticias,
    observaciones: caminante.observaciones,
    parroquia: caminante.parroquia,
    parroco: caminante.parroco,
    imagen: caminante.imagen,
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    if (!currentUser) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("is_super")
      .eq("id", currentUser.id)
      .maybeSingle()

    if (!adminRecord?.is_super) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const { data: caminante, error: fetchError } = await supabase
      .from("caminantes")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ message: fetchError.message }, { status: 400 })
    if (!caminante) return NextResponse.json({ message: "Caminante no encontrado" }, { status: 404 })

    const formData = buildWaitlistFormData(caminante)

    const { error: insertError } = await supabase.from("lista_espera").insert([
      {
        nombre_completo: formData.nombre_completo,
        celular: formData.celular,
        correo: formData.correo,
        form_data: formData,
      },
    ])

    if (insertError) {
      const message = /duplicate key|already exists|unique/i.test(insertError.message)
        ? "No se pudo trasladar porque ya existe una persona en lista de espera con ese correo"
        : insertError.message
      return NextResponse.json({ message }, { status: 409 })
    }

    const { error: deleteError } = await supabase.from("caminantes").delete().eq("id", id)
    if (deleteError) {
      return NextResponse.json(
        { message: "Se movió a lista de espera, pero no se pudo eliminar del listado de caminantes" },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Caminante trasladado a lista de espera" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error moving caminante to waitlist:", error)
    return NextResponse.json({ message: "Error al procesar la solicitud" }, { status: 500 })
  }
}
