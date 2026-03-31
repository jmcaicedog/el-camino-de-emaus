export const MAX_CAMINANTES = 65

export function isCaminanteRegistrationOpen(currentCount: number, maxCaminantes: number = MAX_CAMINANTES): boolean {
  return currentCount < maxCaminantes
}
