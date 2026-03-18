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
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Pagos</h1>

      <div className="mb-10">
        <PaymentForm loans={loans} onSuccess={load} />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Historial de pagos</h2>
      {loading ? (
        <div className="card p-8 text-center text-slate-500">Cargando...</div>
      ) : payments.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">Aún no hay pagos registrados.</div>
      ) : (
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
      )}
    </div>
  )
}
