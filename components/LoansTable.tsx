'use client'

import Link from 'next/link'
import { formatCurrency, formatDate, loanInterest } from '@/lib/format'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'

type LoanWithClient = Loan & { clients?: Client | null }

type Props = {
  loans: LoanWithClient[]
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  overdue: 'Vencido',
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-slate-100 text-slate-700',
  overdue: 'bg-red-100 text-red-800',
}

export default function LoansTable({ loans }: Props) {
  if (loans.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        No hay préstamos. <Link href="/loans/new" className="text-teal-600 hover:underline">Crear el primero</Link>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-700">Cliente</th>
              <th className="px-4 py-3 font-medium text-slate-700">Monto</th>
              <th className="px-4 py-3 font-medium text-slate-700">%</th>
              <th className="px-4 py-3 font-medium text-slate-700">Total</th>
              <th className="px-4 py-3 font-medium text-slate-700">Interés</th>
              <th className="px-4 py-3 font-medium text-slate-700">Saldo</th>
              <th className="px-4 py-3 font-medium text-slate-700">Inicio</th>
              <th className="px-4 py-3 font-medium text-slate-700">Vencimiento</th>
              <th className="px-4 py-3 font-medium text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((l) => {
              const interest = loanInterest(Number(l.total_amount), Number(l.amount))
              return (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/loans/${l.id}`} className="text-teal-600 hover:underline">
                      {l.clients?.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.amount))}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(l.interest_rate)}%</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.total_amount))}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">{formatCurrency(interest)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.remaining_balance))}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(l.start_date)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(l.due_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[l.status] ?? 'bg-slate-100'}`}>
                      {statusLabels[l.status] ?? l.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
