'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import {
  getLoanFrequencyLabel,
  getLoanInstallmentsCount,
  getLoanProjectedMonthlyProfit,
  getLoanSchedule,
} from '@/lib/loanSchedule'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import ProgressBar from '@/components/ProgressBar'
import StatusBanner from '@/components/StatusBanner'
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
  const totalAmount = Number(currentLoan.total_amount)
  const remainingBalance = Number(currentLoan.remaining_balance)
  const paidAmount = Math.max(0, totalAmount - remainingBalance)
  const paidProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(currentLoan.due_date)
  dueDate.setHours(0, 0, 0, 0)
  const dueDiffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const dueTone =
    currentLoan.status === 'overdue' ? 'danger' : dueDiffDays <= 7 ? 'warning' : 'info'
  const dueMessage =
    currentLoan.status === 'paid'
      ? 'Este préstamo ya está liquidado.'
      : currentLoan.status === 'overdue'
        ? `Está vencido desde hace ${Math.abs(dueDiffDays)} día${Math.abs(dueDiffDays) === 1 ? '' : 's'}.`
        : dueDiffDays === 0
          ? 'Vence hoy. Conviene registrar seguimiento o pago.'
          : `Faltan ${dueDiffDays} día${dueDiffDays === 1 ? '' : 's'} para su vencimiento.`
  const paymentFrequencyLabel = getLoanFrequencyLabel(currentLoan)
  const installmentsCount = getLoanInstallmentsCount(currentLoan)
  const schedule = getLoanSchedule(currentLoan)
  const projectedMonthlyProfit = getLoanProjectedMonthlyProfit(currentLoan)
  const estimatedInstallmentAmount = schedule[0]?.totalAmount ?? totalAmount
  const averageProjectedProfit = projectedMonthlyProfit.length
    ? projectedMonthlyProfit.reduce((sum, item) => sum + item.amount, 0) / projectedMonthlyProfit.length
    : 0

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

      <div className="mb-6">
        <StatusBanner
          variant={dueTone}
          title="Seguimiento del préstamo"
          message={dueMessage}
          action={
            currentLoan.status !== 'paid' ? (
              <Link href={`/payments?loan=${currentLoan.id}`} className="btn-primary w-full sm:w-auto">
                Registrar pago
              </Link>
            ) : undefined
          }
        />
      </div>

      <div className="summary-grid mb-6">
        <div className="summary-tile">
          <p className="summary-label">Cobrado</p>
          <p className="summary-value">{formatCurrency(paidAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">Importe recuperado hasta ahora.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Pendiente</p>
          <p className="summary-value">{formatCurrency(remainingBalance)}</p>
          <p className="mt-1 text-xs text-slate-500">Saldo que sigue abierto en la operación.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Progreso</p>
          <p className="summary-value">{Math.round(paidProgress)}%</p>
          <p className="mt-1 text-xs text-slate-500">Avance de recuperación sobre el total a cobrar.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Estado</p>
          <p className="summary-value text-lg sm:text-xl">{statusLabels[currentLoan.status] ?? currentLoan.status}</p>
          <p className="mt-1 text-xs text-slate-500">Lectura rápida para seguimiento comercial.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Resumen</h2>
          <div className="mb-5">
            <ProgressBar
              value={paidProgress}
              label="Recuperación del préstamo"
              tone={currentLoan.status === 'paid' ? 'success' : currentLoan.status === 'overdue' ? 'danger' : 'default'}
            />
          </div>
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
              <dt className="text-sm text-slate-500">Modalidad</dt>
              <dd className="font-medium text-slate-900">{paymentFrequencyLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Cuotas estimadas</dt>
              <dd className="font-medium text-slate-900">
                {currentLoan.payment_frequency === 'biweekly' ? installmentsCount : 'Pago final'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Total a cobrar</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(Number(currentLoan.total_amount))}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Valor estimado por cuota</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(estimatedInstallmentAmount)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Ganancia (interés) de este préstamo</dt>
              <dd className="font-medium text-emerald-600">
                {formatCurrency(loanInterest(Number(currentLoan.total_amount), Number(currentLoan.amount)))}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Ganancia mensual proyectada</dt>
              <dd className="font-medium text-emerald-600">{formatCurrency(averageProjectedProfit)}</dd>
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
            <Link href={`/payments?loan=${currentLoan.id}`} className="btn-primary mt-4 inline-flex w-full sm:w-auto">
              Registrar pago
            </Link>
          )}
        </div>

        <div className="card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Calendario estimado</h2>
          <StatusBanner
            variant="info"
            title={currentLoan.payment_frequency === 'biweekly' ? 'Plan de 3 quincenas' : 'Proyección mensual'}
            message={
              currentLoan.payment_frequency === 'biweekly'
                ? 'Cada cuota reparte capital e interés del 20% total del préstamo.'
                : 'La ganancia se distribuye de forma uniforme entre los meses comprendidos entre inicio y vencimiento.'
            }
          />
          <div className="mt-4 space-y-3">
            {currentLoan.payment_frequency === 'biweekly'
              ? schedule.map((item) => (
                  <div key={item.number} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Cuota {item.number}</p>
                        <p className="text-sm text-slate-500">Vence {formatDate(item.dueDate)}</p>
                      </div>
                      <p className="text-base font-semibold text-slate-900">
                        {formatCurrency(item.totalAmount)}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-slate-500">Capital estimado</p>
                        <p className="font-medium text-slate-900">{formatCurrency(item.principalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Interés estimado</p>
                        <p className="font-medium text-emerald-600">{formatCurrency(item.interestAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))
              : projectedMonthlyProfit.map((item) => (
                  <div key={item.key} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500">Ganancia estimada del periodo</p>
                      </div>
                      <p className="font-semibold text-emerald-600">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                ))}
          </div>
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
