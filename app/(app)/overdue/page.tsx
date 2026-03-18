'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'

type LoanWithClient = Loan & { clients: Client | null }

function daysOverdue(dueDate: string) {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export default function OverduePage() {
  const [loans, setLoans] = useState<LoanWithClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const { data } = await supabase
        .from('loans')
        .select('*, clients(*)')
        .in('status', ['active', 'overdue'])
        .order('due_date', { ascending: true })
      const list = (data ?? []) as LoanWithClient[]
      const withOverdue = list.map((loan) => normalizeLoanStatus(loan))
      setLoans(withOverdue.filter((l) => l.status === 'overdue'))
      setLoading(false)
    }
    load()
  }, [])

  const riskyClients = Array.from(
    new Map(
      loans
        .filter((l) => daysOverdue(l.due_date) >= 30)
        .map((l) => [l.client_id, { name: l.clients?.name ?? '—', client_id: l.client_id }])
    ).values()
  )

  return (
    <div className="page-shell">
      <h1 className="mb-6 page-title sm:mb-8">Préstamos vencidos</h1>

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : loans.length === 0 ? (
        <div className="empty-state">
          No hay préstamos vencidos.
        </div>
      ) : (
        <>
          {riskyClients.length > 0 && (
            <div className="card mb-8 border-amber-200 bg-amber-50/50 p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold text-amber-900">Clientes de riesgo (30+ días vencidos)</h2>
              <ul className="space-y-1">
                {riskyClients.map((c) => (
                  <li key={c.client_id}>
                    <Link href={`/clients/${c.client_id}`} className="text-amber-800 hover:underline font-medium">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3 md:hidden">
            {loans.map((l) => {
              const days = daysOverdue(l.due_date)

              return (
                <div key={l.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/clients/${l.client_id}`} className="font-semibold text-teal-600 hover:underline">
                        {l.clients?.name ?? '—'}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">Vence: {formatDate(l.due_date)}</p>
                    </div>
                    <span className={days >= 30 ? 'font-semibold text-red-600' : 'font-medium text-slate-700'}>
                      {days} días
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{formatCurrency(Number(l.remaining_balance))}</p>
                    <Link href={`/loans/${l.id}`} className="btn-secondary">
                      Ver préstamo
                    </Link>
                  </div>
                </div>
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
                      <th className="px-4 py-3 font-medium text-slate-700">Saldo</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Vencimiento</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Días vencido</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.map((l) => {
                      const days = daysOverdue(l.due_date)
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <Link href={`/clients/${l.client_id}`} className="text-teal-600 hover:underline">
                              {l.clients?.name ?? '—'}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.remaining_balance))}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(l.due_date)}</td>
                          <td className="px-4 py-3">
                            <span className={days >= 30 ? 'font-semibold text-red-600' : 'text-slate-700'}>
                              {days} días
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/loans/${l.id}`} className="text-teal-600 hover:underline">
                              Ver préstamo
                            </Link>
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
      )}
    </div>
  )
}
