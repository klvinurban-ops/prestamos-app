'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'

type LoanOption = Loan & { clients: Client | null }

type Props = {
  loans: LoanOption[]
  onSuccess: () => void
}

export default function PaymentForm({ loans, onSuccess }: Props) {
  const [loanId, setLoanId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue')
  const selectedLoan = activeLoans.find((l) => l.id === loanId)
  const maxPayment = selectedLoan ? Number(selectedLoan.remaining_balance) : 0

  useEffect(() => {
    if (selectedLoan && amount) {
      const num = parseFloat(amount)
      if (num > maxPayment) setAmount(String(maxPayment))
    }
  }, [selectedLoan, maxPayment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!loanId) {
      setError('Selecciona un préstamo.')
      return
    }
    const amountNum = parseFloat(amount)
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
      onSuccess()
      setLoanId('')
      setAmount('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago.')
    } finally {
      setSaving(false)
    }
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
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
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
        <p className="text-sm text-slate-600">
          Saldo restante: <strong>{formatCurrency(maxPayment)}</strong>
        </p>
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
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
        {saving ? 'Guardando...' : 'Registrar pago'}
      </button>
    </form>
  )
}
