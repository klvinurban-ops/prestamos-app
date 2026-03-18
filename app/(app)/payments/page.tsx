'use client'

import { useEffect, useState } from 'react'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency, formatDate } from '@/lib/format'
import PaymentForm from '@/components/PaymentForm'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'
import type { Payment } from '@/types/database'

type LoanWithClient = Loan & { clients: Client | null }
type PaymentWithLoan = Payment & { loans: LoanWithClient | null }

export default function PaymentsPage() {
  const [loans, setLoans] = useState<LoanWithClient[]>([])
  const [payments, setPayments] = useState<PaymentWithLoan[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const supabase = getSupabaseBrowser()
    const [loansRes, paymentsRes] = await Promise.all([
      supabase.from('loans').select('*, clients(*)').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, loans(*, clients(*))').order('payment_date', { ascending: false }),
    ])
    setLoans((((loansRes.data as LoanWithClient[]) ?? []).map((loan) => normalizeLoanStatus(loan))))
    setPayments((paymentsRes.data as PaymentWithLoan[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="page-shell">
      <h1 className="mb-6 page-title sm:mb-8">Pagos</h1>

      <div className="mb-8 sm:mb-10">
        <PaymentForm loans={loans} onSuccess={load} />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Historial de pagos</h2>
      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">Aún no hay pagos registrados.</div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {payments.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{(p.loans as LoanWithClient)?.clients?.name ?? '—'}</p>
                    <p className="text-sm text-slate-500">{formatDate(p.payment_date)}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-slate-900">{formatCurrency(Number(p.amount))}</p>
                </div>
                <p className="mt-3 text-sm text-slate-500">{p.notes || 'Sin notas'}</p>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">Fecha</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Préstamo / Cliente</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Monto</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {(p.loans as LoanWithClient)?.clients?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(p.amount))}</td>
                        <td className="px-4 py-3 text-slate-500">{p.notes || '—'}</td>
                      </tr>
                    ))}
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
