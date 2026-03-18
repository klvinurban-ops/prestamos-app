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
      <div className="empty-state">
        No hay préstamos. <Link href="/loans/new" className="text-teal-600 hover:underline">Crear el primero</Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {loans.map((l) => {
          const interest = loanInterest(Number(l.total_amount), Number(l.amount))

          return (
            <Link key={l.id} href={`/loans/${l.id}`} className="card block p-4 transition-colors hover:bg-slate-50/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">{l.clients?.name ?? '—'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(l.start_date)} - {formatDate(l.due_date)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[l.status] ?? 'bg-slate-100'}`}>
                  {statusLabels[l.status] ?? l.status}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Monto</dt>
                  <dd className="font-medium text-slate-900">{formatCurrency(Number(l.amount))}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Saldo</dt>
                  <dd className="font-medium text-slate-900">{formatCurrency(Number(l.remaining_balance))}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Interés</dt>
                  <dd className="font-medium text-emerald-600">{formatCurrency(interest)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tasa</dt>
                  <dd className="font-medium text-slate-900">{Number(l.interest_rate)}%</dd>
                </div>
              </dl>
            </Link>
          )
        })}
      </div>

      <div className="hidden md:block">
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
      </div>
    </>
  )
}
