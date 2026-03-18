import { loanInterest } from '@/lib/format'
import type { Loan, PaymentFrequency } from '@/types/database'

type LoanLike = Pick<
  Loan,
  'amount' | 'total_amount' | 'start_date' | 'due_date' | 'payment_frequency' | 'installments_count'
> &
  Partial<Pick<Loan, 'interest_rate'>>

export type InstallmentScheduleItem = {
  number: number
  dueDate: string
  totalAmount: number
  principalAmount: number
  interestAmount: number
}

export type MonthlyProjection = {
  key: string
  month: string
  label: string
  amount: number
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const BIWEEKLY_DAYS = 15
const BIWEEKLY_DEFAULT_INSTALLMENTS = 3

function toDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setHours(0, 0, 0, 0)
  return date
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateStr: string, days: number) {
  const date = toDate(dateStr)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

function getMonthKey(dateStr: string) {
  const date = toDate(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(key: string) {
  const [year, month] = key.split('-')
  return `${MONTHS_ES[Number(month) - 1]} ${year}`
}

function getMonthsBetween(startDate: string, dueDate: string) {
  const start = toDate(startDate)
  const end = toDate(dueDate)
  const months: string[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor <= endMonth) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months.length > 0 ? months : [getMonthKey(startDate)]
}

function splitAmount(total: number, parts: number) {
  if (parts <= 0) return []

  const centsTotal = Math.round(total * 100)
  const base = Math.floor(centsTotal / parts)
  const remainder = centsTotal - base * parts

  return Array.from({ length: parts }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100)
}

export function getLoanPaymentFrequency(loan: Partial<LoanLike>): PaymentFrequency {
  return loan.payment_frequency === 'biweekly' ? 'biweekly' : 'monthly'
}

export function getLoanInstallmentsCount(loan: Partial<LoanLike>) {
  const frequency = getLoanPaymentFrequency(loan)
  const configured = Number(loan.installments_count)

  if (Number.isFinite(configured) && configured > 0) {
    return Math.round(configured)
  }

  return frequency === 'biweekly' ? BIWEEKLY_DEFAULT_INSTALLMENTS : 1
}

export function getLoanFrequencyLabel(loan: Partial<LoanLike>) {
  return getLoanPaymentFrequency(loan) === 'biweekly' ? '3 quincenas' : 'Mensual / fecha final'
}

export function getBiweeklyDueDate(startDate: string, installmentsCount = BIWEEKLY_DEFAULT_INSTALLMENTS) {
  return addDays(startDate, BIWEEKLY_DAYS * installmentsCount)
}

export function getLoanSchedule(loan: LoanLike): InstallmentScheduleItem[] {
  const installmentsCount = getLoanInstallmentsCount(loan)
  const totalInstallments = splitAmount(Number(loan.total_amount), installmentsCount)
  const principalInstallments = splitAmount(Number(loan.amount), installmentsCount)
  const interestInstallments = splitAmount(
    loanInterest(Number(loan.total_amount), Number(loan.amount)),
    installmentsCount
  )

  return Array.from({ length: installmentsCount }, (_, index) => {
    const frequency = getLoanPaymentFrequency(loan)
    const dueDate =
      frequency === 'biweekly'
        ? addDays(loan.start_date, BIWEEKLY_DAYS * (index + 1))
        : index === installmentsCount - 1
          ? loan.due_date
          : loan.start_date

    return {
      number: index + 1,
      dueDate,
      totalAmount: totalInstallments[index] ?? 0,
      principalAmount: principalInstallments[index] ?? 0,
      interestAmount: interestInstallments[index] ?? 0,
    }
  })
}

export function getLoanProjectedMonthlyProfit(loan: LoanLike): MonthlyProjection[] {
  const frequency = getLoanPaymentFrequency(loan)
  const totalProfit = loanInterest(Number(loan.total_amount), Number(loan.amount))

  if (totalProfit <= 0) {
    return []
  }

  if (frequency === 'biweekly') {
    const byMonth: Record<string, number> = {}
    getLoanSchedule(loan).forEach((item) => {
      const key = getMonthKey(item.dueDate)
      byMonth[key] = (byMonth[key] ?? 0) + item.interestAmount
    })

    return Object.entries(byMonth).map(([key, amount]) => ({
      key,
      month: getMonthLabel(key),
      label: getMonthLabel(key),
      amount,
    }))
  }

  const months = getMonthsBetween(loan.start_date, loan.due_date)
  const distributed = splitAmount(totalProfit, months.length)

  return months.map((key, index) => ({
    key,
    month: getMonthLabel(key),
    label: getMonthLabel(key),
    amount: distributed[index] ?? 0,
  }))
}

export function buildProjectedMonthlyProfitData(loans: LoanLike[]) {
  const byMonth: Record<string, number> = {}

  loans.forEach((loan) => {
    getLoanProjectedMonthlyProfit(loan).forEach((item) => {
      byMonth[item.key] = (byMonth[item.key] ?? 0) + item.amount
    })
  })

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, amount]) => ({
      key,
      month: getMonthLabel(key),
      label: getMonthLabel(key),
      amount,
    }))
}
