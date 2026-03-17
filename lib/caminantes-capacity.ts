export const MAX_CAMINANTES = 65

export function isCaminanteRegistrationOpen(currentCount: number): boolean {
  return currentCount < MAX_CAMINANTES
}
