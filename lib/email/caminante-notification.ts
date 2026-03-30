interface CaminanteNotificationInput {
  nombre_completo: string
  cedula: string
  celular: string
  correo: string
  edad: number
}

export function buildNuevoCaminanteRegistradoNotification(caminante: CaminanteNotificationInput) {
  const subject = "Nuevo caminante registrado"
  const text = `Se ha registrado un nuevo caminante en la plataforma.\n\nNombre: ${caminante.nombre_completo}\nCédula: ${caminante.cedula}\nCelular: ${caminante.celular}\nCorreo: ${caminante.correo}\nEdad: ${caminante.edad} años\n\nRevisa la plataforma para más detalles.`
  const html = `
    <h2>Nuevo caminante registrado</h2>
    <p>Se ha registrado un nuevo caminante en la plataforma:</p>
    <ul>
      <li><strong>Nombre:</strong> ${caminante.nombre_completo}</li>
      <li><strong>Cédula:</strong> ${caminante.cedula}</li>
      <li><strong>Celular:</strong> ${caminante.celular}</li>
      <li><strong>Correo:</strong> ${caminante.correo}</li>
      <li><strong>Edad:</strong> ${caminante.edad} años</li>
    </ul>
    <p>Revisa la plataforma para más detalles.</p>
  `

  return { subject, text, html }
}
