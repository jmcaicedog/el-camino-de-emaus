type RegistrationEntity = "caminante" | "servidor" | "lista_espera"

type ErrorLike = {
  code?: string
  message?: string
  details?: string
}

type PublicRegistrationErrorResponse = {
  message: string
  status: number
  code?: "already_registered"
}

function isDuplicateKeyError(error: ErrorLike): boolean {
  return error.code === "23505" || error.message?.toLowerCase().includes("duplicate key value") === true
}

function getDuplicateRegistrationMessage(entity: RegistrationEntity, error: ErrorLike): string {
  const constraint = error.message?.toLowerCase() ?? ""
  const details = error.details?.toLowerCase() ?? ""

  if (entity === "lista_espera") {
    return "Ya tenemos tus datos registrados en la lista de espera. Te contactaremos si se libera un cupo."
  }

  if (constraint.includes("cedula") || details.includes("cedula")) {
    return `Ya existe una inscripción registrada con esta cédula como ${entity}. No necesitas completar el formulario nuevamente.`
  }

  if (constraint.includes("correo") || details.includes("correo")) {
    return `Ya existe una inscripción registrada con este correo como ${entity}. No necesitas completar el formulario nuevamente.`
  }

  return `Ya existe una inscripción registrada como ${entity}. No necesitas completar el formulario nuevamente.`
}

export function buildPublicRegistrationErrorResponse(
  error: unknown,
  entity: RegistrationEntity,
): PublicRegistrationErrorResponse {
  const normalizedError = typeof error === "object" && error !== null ? (error as ErrorLike) : {}

  if (isDuplicateKeyError(normalizedError)) {
    return {
      status: 409,
      code: "already_registered",
      message: getDuplicateRegistrationMessage(entity, normalizedError),
    }
  }

  return {
    status: 400,
    message: normalizedError.message || "Error al registrar",
  }
}