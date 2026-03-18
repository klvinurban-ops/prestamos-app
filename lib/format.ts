/**
 * Formato de moneda: COP (peso colombiano) - símbolo $
 * Para usar otra moneda, cambia CURRENCY y LOCALE aquí.
 */
const CURRENCY = 'COP'
const LOCALE = 'es-CO'

export function formatCurrency(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value)
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
