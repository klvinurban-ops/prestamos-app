'use client'

import { useEffect, useState } from 'react'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency, formatDate } from '@/lib/format'
import PaymentForm from '@/components/PaymentForm'
import StatusBanner from '@/components/StatusBanner'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'
import type { Payment } from '@/types/database'

type LoanWithClient = Loan & { clients: Client | null }
type PaymentWithLoan = Payment & { loans: LoanWithClient | null }

export default function PaymentsPage() {
  const [loans, setLoans] = useState<LoanWithClient[]>([])
  const [payments, setPayments] = useState<PaymentWithLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLoanIdFromUrl, setSelectedLoanIdFromUrl] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [editingNotes, setEditingNotes] = useState('')
  const [editingBusy, setEditingBusy] = useState(false)

  function normalizeMoneyInput(raw: string) {
    const cleaned = raw.replace(/[^\d,.-]/g, '').trim()
    if (!cleaned) return 0
    if (cleaned.includes(',') && cleaned.includes('.')) {
      return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0
    }
    const dotParts = cleaned.split('.')
    const looksLikeThousands = cleaned.includes('.') && dotParts.length > 1 && dotParts.every((part, index) => index === 0 || part.length === 3)
    if (looksLikeThousands) {
      return Number(cleaned.replace(/\./g, '')) || 0
    }
    return Number(cleaned.replace(',', '.')) || 0
  }

  function startEdit(payment: PaymentWithLoan) {
    setEditingPaymentId(payment.id)
    setEditingAmount(String(Number(payment.amount)))
    setEditingDate(payment.payment_date.slice(0, 10))
    setEditingNotes(payment.notes ?? '')
  }

  async function saveEdit(paymentId: string) {
    const amount = normalizeMoneyInput(editingAmount)
    if (amount <= 0 || !editingDate) return
    setEditingBusy(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          payment_id: paymentId,
          amount,
          payment_date: editingDate,
          notes: editingNotes.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'No se pudo editar el pago')
      await load()
      setSuccessMessage('Pago editado correctamente.')
      setEditingPaymentId(null)
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'No se pudo editar el pago.')
    } finally {
      setEditingBusy(false)
    }
  }

  async function deletePayment(paymentId: string) {
    setEditingBusy(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ payment_id: paymentId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el pago')
      await load()
      setSuccessMessage('Pago eliminado correctamente.')
      if (editingPaymentId === paymentId) setEditingPaymentId(null)
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : 'No se pudo eliminar el pago.')
    } finally {
      setEditingBusy(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setSelectedLoanIdFromUrl(params.get('loan'))
  }, [])

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

      {successMessage && (
        <div className="mb-4">
          <StatusBanner variant="success" title="Pago registrado" message={successMessage} />
        </div>
      )}

      <div className="mb-8 sm:mb-10">
        <PaymentForm
          loans={loans}
          loading={loading}
          initialLoanId={selectedLoanIdFromUrl}
          onSuccess={async (details) => {
            await load()
            if (details) {
              setSuccessMessage(
                details.paidOff
                  ? `Cobraste ${formatCurrency(details.amount)} a ${details.loanName}. El préstamo quedó liquidado.`
                  : `Cobraste ${formatCurrency(details.amount)} a ${details.loanName}. Nuevo saldo: ${formatCurrency(details.newBalance)}.`
              )
            }
          }}
        />
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
                {editingPaymentId === p.id ? (
                  <div className="mt-3 space-y-2">
                    <input className="input" value={editingAmount} onChange={(e) => setEditingAmount(e.target.value)} placeholder="Monto" />
                    <input className="input" type="date" value={editingDate} onChange={(e) => setEditingDate(e.target.value)} />
                    <input className="input" value={editingNotes} onChange={(e) => setEditingNotes(e.target.value)} placeholder="Notas" />
                    <div className="flex gap-2">
                      <button type="button" className="btn-primary" disabled={editingBusy} onClick={() => saveEdit(p.id)}>Guardar</button>
                      <button type="button" className="btn-secondary" disabled={editingBusy} onClick={() => setEditingPaymentId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-3 text-sm text-slate-500">{p.notes || 'Sin notas'}</p>
                    <div className="mt-3 flex gap-3">
                      <button type="button" className="text-slate-600" onClick={() => startEdit(p)} title="Editar pago">✏️</button>
                      <button type="button" className="text-red-600" onClick={() => deletePayment(p.id)} title="Eliminar pago">🗑️</button>
                    </div>
                  </>
                )}
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
                      <th className="px-4 py-3 font-medium text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">
                          {editingPaymentId === p.id ? (
                            <input className="input" type="date" value={editingDate} onChange={(e) => setEditingDate(e.target.value)} />
                          ) : (
                            formatDate(p.payment_date)
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {(p.loans as LoanWithClient)?.clients?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {editingPaymentId === p.id ? (
                            <input className="input" value={editingAmount} onChange={(e) => setEditingAmount(e.target.value)} />
                          ) : (
                            formatCurrency(Number(p.amount))
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {editingPaymentId === p.id ? (
                            <input className="input" value={editingNotes} onChange={(e) => setEditingNotes(e.target.value)} />
                          ) : (
                            p.notes || '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {editingPaymentId === p.id ? (
                            <div className="flex gap-2">
                              <button type="button" className="btn-primary" disabled={editingBusy} onClick={() => saveEdit(p.id)}>Guardar</button>
                              <button type="button" className="btn-secondary" disabled={editingBusy} onClick={() => setEditingPaymentId(null)}>Cancelar</button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button type="button" className="text-slate-600" onClick={() => startEdit(p)} title="Editar pago">✏️</button>
                              <button type="button" className="text-red-600" onClick={() => deletePayment(p.id)} title="Eliminar pago">🗑️</button>
                            </div>
                          )}
                        </td>
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
