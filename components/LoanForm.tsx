'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'
import type { Loan, Client } from '@/types/database'

type Props = {
  clients: Client[]
  loan?: Loan | null
  onSubmit: (data: {
    client_id: string
    amount: number
    interest_rate: number
    total_amount: number
    remaining_balance: number
    start_date: string
    due_date: string
    status: 'active' | 'paid' | 'overdue'
  }) => Promise<void>
  onCancel?: () => void
}

function computeTotal(amount: number, rate: number) {
  return Math.round(amount * (1 + rate / 100) * 100) / 100
}

export default function LoanForm({ clients, loan, onSubmit, onCancel }: Props) {
  const [clientId, setClientId] = useState(loan?.client_id ?? '')
  const [amount, setAmount] = useState(loan?.amount ? String(loan.amount) : '')
  const [interestRate, setInterestRate] = useState(loan?.interest_rate ? String(loan.interest_rate) : '')
  const [startDate, setStartDate] = useState(loan?.start_date ?? new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(loan?.due_date ?? '')
  const [amountAlreadyPaid, setAmountAlreadyPaid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const amountNum = parseFloat(amount) || 0
  const rateNum = parseFloat(interestRate) || 0
  const totalAmount = computeTotal(amountNum, rateNum)
  const paidNum = parseFloat(amountAlreadyPaid) || 0
  const initialRemaining = Math.max(0, Math.min(totalAmount, totalAmount - paidNum))
  const remainingBalance = loan ? Number(loan.remaining_balance) : initialRemaining

  useEffect(() => {
    if (!dueDate && startDate) {
      setDueDate(startDate)
    }
  }, [startDate, dueDate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!clientId) {
      setError('Selecciona un cliente.')
      return
    }
    if (amountNum <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (!startDate || !dueDate) {
      setError('Indica fecha de inicio y vencimiento.')
      return
    }
    if (paidNum > totalAmount) {
      setError('El monto ya cobrado no puede ser mayor al total a cobrar.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        client_id: clientId,
        amount: amountNum,
        interest_rate: rateNum,
        total_amount: totalAmount,
        remaining_balance: loan ? remainingBalance : initialRemaining,
        start_date: startDate,
        due_date: dueDate,
        status: loan?.status ?? 'active',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="label" htmlFor="client">Cliente *</label>
        <select
          id="client"
          className="input"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          disabled={!!loan}
        >
          <option value="">Seleccionar cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="amount">Monto del préstamo *</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="interest_rate">Tasa de interés (%) *</label>
          <input
            id="interest_rate"
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="10"
            required
          />
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 space-y-1">
        <p className="text-sm text-slate-600">Total a cobrar (calculado)</p>
        <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
        <p className="text-xs text-slate-500">
          Interés (ganancia): {formatCurrency(totalAmount - amountNum)}
        </p>
      </div>
      {!loan && (
        <div>
          <label className="label" htmlFor="amount_paid">
            Monto ya cobrado (opcional) — para préstamos en curso
          </label>
          <input
            id="amount_paid"
            type="number"
            step="0.01"
            min="0"
            max={totalAmount}
            className="input"
            value={amountAlreadyPaid}
            onChange={(e) => setAmountAlreadyPaid(e.target.value)}
            placeholder="0 si es préstamo nuevo"
          />
          <p className="mt-1 text-xs text-slate-500">
            Si el cliente ya te ha pagado algo, ingrésalo aquí. Saldo restante: {formatCurrency(initialRemaining)}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="start_date">Fecha de inicio *</label>
          <input
            id="start_date"
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="due_date">Fecha de vencimiento *</label>
          <input
            id="due_date"
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
      </div>
      {loan && (
        <div className="rounded-lg bg-amber-50 p-4">
          <p className="text-sm text-slate-600">Saldo restante</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(remainingBalance)}</p>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : loan ? 'Actualizar préstamo' : 'Crear préstamo'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
