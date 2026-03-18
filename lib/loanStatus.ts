import type { Loan } from '@/types/database'

type LoanStatus = Loan['status']

type LoanStatusSource = Pick<Loan, 'status' | 'due_date' | 'remaining_balance'>

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function getLoanStatus(
  loan: LoanStatusSource,
  today = getTodayIsoDate()
): LoanStatus {
  const remainingBalance = Number(loan.remaining_balance)

  if (remainingBalance <= 0 || loan.status === 'paid') {
    return 'paid'
  }

  if (loan.due_date < today) {
    return 'overdue'
  }

  return 'active'
}

export function normalizeLoanStatus<T extends LoanStatusSource>(
  loan: T,
  today = getTodayIsoDate()
): T {
  return {
    ...loan,
    status: getLoanStatus(loan, today),
  }
}
