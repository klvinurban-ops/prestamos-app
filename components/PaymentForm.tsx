'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'
import StatusBanner from '@/components/StatusBanner'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'

type LoanOption = Loan & { clients: Client | null }

type Props = {
  loans: LoanOption[]
  loading?: boolean
  initialLoanId?: string | null
  onSuccess: (details?: {
    loanName: string
    amount: number
    newBalance: number
    paidOff: boolean
  }) => void
}

export default function PaymentForm({ loans, loading = false, initialLoanId, onSuccess }: Props) {
  const [loanId, setLoanId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue')
  const selectedLoan = activeLoans.find((l) => l.id === loanId)
  const maxPayment = selectedLoan ? Number(selectedLoan.remaining_balance) : 0
  const amountNum = parseFloat(amount) || 0
  const projectedBalance = Math.max(0, maxPayment - amountNum)

  useEffect(() => {
    if (selectedLoan && amount) {
      const num = parseFloat(amount)
      if (num > maxPayment) setAmount(String(maxPayment))
    }
  }, [selectedLoan, maxPayment])

  useEffect(() => {
    if (initialLoanId && activeLoans.some((loan) => loan.id === initialLoanId)) {
      setLoanId((current) => current || initialLoanId)
    }
  }, [activeLoans, initialLoanId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!loanId) {
      setError('Selecciona un préstamo.')
      return
    }
    if (!amountNum || amountNum <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (amountNum > maxPayment) {
      setError(`El monto no puede superar el saldo restante (${formatCurrency(maxPayment)}).`)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          loan_id: loanId,
          amount: amountNum,
          payment_date: paymentDate,
          notes: notes.trim() || null,
        }),
      })
      const text = await res.text()
      const json = text ? (() => { try { return JSON.parse(text) } catch { return {} } })() : {}
      if (!res.ok) throw new Error(json.error || res.statusText || 'Error al registrar el pago')
      if (json.error) throw new Error(json.error)
      const nextBalance = Math.max(0, maxPayment - amountNum)
      onSuccess({
        loanName: selectedLoan?.clients?.name ?? 'Cliente',
        amount: amountNum,
        newBalance: nextBalance,
        paidOff: nextBalance <= 0,
      })
      setLoanId('')
      setAmount('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card p-6 text-slate-500">Cargando préstamos disponibles...</div>
  }

  if (activeLoans.length === 0) {
    return (
      <div className="card p-6 text-slate-500">
        No hay préstamos activos o vencidos para registrar pagos.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Registrar pago</h2>
      {error && (
        <StatusBanner variant="danger" message={error} />
      )}
      <div>
        <label className="label" htmlFor="loan">Préstamo *</label>
        <select
          id="loan"
          className="input"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
          required
        >
          <option value="">Seleccionar préstamo</option>
          {activeLoans.map((l) => (
            <option key={l.id} value={l.id}>
              {l.clients?.name ?? 'Cliente'} — Saldo: {formatCurrency(Number(l.remaining_balance))}
            </option>
          ))}
        </select>
      </div>
      {selectedLoan && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Cliente</p>
              <p className="font-semibold text-slate-900">{selectedLoan.clients?.name ?? 'Cliente'}</p>
              <p className="mt-1 text-sm text-slate-500">
                Vencimiento: {selectedLoan.due_date}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[260px]">
              <div>
                <p className="text-slate-500">Saldo actual</p>
                <p className="font-semibold text-slate-900">{formatCurrency(maxPayment)}</p>
              </div>
              <div>
                <p className="text-slate-500">Saldo luego del pago</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(projectedBalance)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="amount">Monto *</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            max={maxPayment}
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="payment_date">Fecha *</label>
          <input
            id="payment_date"
            type="date"
            className="input"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="notes">Notas</label>
        <input
          id="notes"
          type="text"
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      {selectedLoan && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Montos rápidos</p>
          <div className="flex flex-wrap gap-2">
            {[0.25, 0.5, 1].map((fraction) => {
              const quickAmount = Math.round(maxPayment * fraction * 100) / 100
              const label =
                fraction === 1 ? 'Liquidar' : `${Math.round(fraction * 100)}%`

              return (
                <button
                  key={fraction}
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAmount(String(quickAmount))}
                >
                  {label} ({formatCurrency(quickAmount)})
                </button>
              )
            })}
          </div>
        </div>
      )}
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
        {saving ? 'Guardando...' : 'Registrar pago'}
      </button>
    </form>
  )
}
