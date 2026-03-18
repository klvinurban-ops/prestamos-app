'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency, formatDate, loanInterest } from '@/lib/format'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'
import type { Payment } from '@/types/database'

const statusLabels: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  overdue: 'Vencido',
}

export default function LoanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loan, setLoan] = useState<(Loan & { clients: Client | null }) | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const [loanRes, paymentsRes] = await Promise.all([
        supabase.from('loans').select('*, clients(*)').eq('id', id).single(),
        supabase.from('payments').select('*').eq('loan_id', id).order('payment_date', { ascending: false }),
      ])
      setLoan(loanRes.data as (Loan & { clients: Client | null }) | null)
      setPayments((paymentsRes.data ?? []) as Payment[])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="page-shell">Cargando...</div>
  if (!loan) return <div className="page-shell">Préstamo no encontrado.</div>

  const currentLoan = normalizeLoanStatus(loan)

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Link href="/loans" className="text-slate-500 hover:text-slate-700">
          ← Préstamos
        </Link>
        <h1 className="page-title">
          Préstamo — {currentLoan.clients?.name ?? 'Cliente'}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Resumen</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-slate-500">Cliente</dt>
              <dd>
                <Link href={`/clients/${currentLoan.client_id}`} className="font-medium text-teal-600 hover:underline">
                  {currentLoan.clients?.name ?? '—'}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Monto</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(Number(currentLoan.amount))}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Tasa de interés acordada</dt>
              <dd className="font-medium text-slate-900">{Number(currentLoan.interest_rate)}%</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Total a cobrar</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(Number(currentLoan.total_amount))}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Ganancia (interés) de este préstamo</dt>
              <dd className="font-medium text-emerald-600">
                {formatCurrency(loanInterest(Number(currentLoan.total_amount), Number(currentLoan.amount)))}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Saldo restante</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(Number(currentLoan.remaining_balance))}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Fecha inicio / Fecha vencimiento</dt>
              <dd className="font-medium text-slate-900">
                {formatDate(currentLoan.start_date)} — {formatDate(currentLoan.due_date)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Estado</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    currentLoan.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : currentLoan.status === 'paid'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {statusLabels[currentLoan.status] ?? currentLoan.status}
                </span>
              </dd>
            </div>
          </dl>
          {currentLoan.status !== 'paid' && Number(currentLoan.remaining_balance) > 0 && (
            <Link href="/payments" className="btn-primary mt-4 inline-flex w-full sm:w-auto">
              Registrar pago
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Historial de pagos</h2>
        {payments.length === 0 ? (
          <div className="empty-state">Aún no hay pagos.</div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {payments.map((p) => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{formatCurrency(Number(p.amount))}</p>
                      <p className="text-sm text-slate-500">{formatDate(p.payment_date)}</p>
                    </div>
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
                        <th className="px-4 py-3 font-medium text-slate-700">Monto</th>
                        <th className="px-4 py-3 font-medium text-slate-700">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-600">{formatDate(p.payment_date)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(Number(p.amount))}</td>
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
    </div>
  )
}
