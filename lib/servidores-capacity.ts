export const MAX_SERVIDORES = 60

export function isServidorRegistrationOpen(currentCount: number, maxServidores: number = MAX_SERVIDORES): boolean {
  return currentCount < maxServidores
}
