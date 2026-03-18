/**
 * Formato de moneda comercial con separador de miles.
 * Resultado esperado: $1.000.000
 */
const LOCALE = 'es-CO'

export function formatCurrency(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(Math.abs(value))

  return `${value < 0 ? '-' : ''}$${formatted}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Interés (ganancia) de un préstamo = total a cobrar - monto prestado */
export function loanInterest(totalAmount: number, amount: number): number {
  return Math.round((totalAmount - amount) * 100) / 100
}
