'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/format'
import { getBiweeklyDueDate, getLoanSchedule } from '@/lib/loanSchedule'
import StatusBanner from '@/components/StatusBanner'
import type { Loan, Client, PaymentFrequency } from '@/types/database'

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
    payment_frequency: PaymentFrequency
    installments_count: number
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
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(loan?.payment_frequency ?? 'monthly')
  const [amountAlreadyPaid, setAmountAlreadyPaid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const installmentsCount = paymentFrequency === 'biweekly' ? 3 : 1
  const amountNum = parseFloat(amount) || 0
  const rateNum = paymentFrequency === 'biweekly' ? 20 : parseFloat(interestRate) || 0
  const totalAmount = computeTotal(amountNum, rateNum)
  const paidNum = parseFloat(amountAlreadyPaid) || 0
  const initialRemaining = Math.max(0, Math.min(totalAmount, totalAmount - paidNum))
  const remainingBalance = loan ? Number(loan.remaining_balance) : initialRemaining
  const biweeklyPreview =
    paymentFrequency === 'biweekly' && amountNum > 0
      ? getLoanSchedule({
          amount: amountNum,
          total_amount: totalAmount,
          start_date: startDate,
          due_date: getBiweeklyDueDate(startDate, installmentsCount),
          payment_frequency: 'biweekly',
          installments_count: installmentsCount,
          interest_rate: rateNum,
        })
      : []

  useEffect(() => {
    if (paymentFrequency === 'biweekly') {
      setInterestRate('20')
      setDueDate(getBiweeklyDueDate(startDate, installmentsCount))
      return
    }

    if (!dueDate && startDate) {
      setDueDate(startDate)
    }
  }, [startDate, dueDate, installmentsCount, paymentFrequency])

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
        payment_frequency: paymentFrequency,
        installments_count: installmentsCount,
        status: loan?.status ?? 'active',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && (
        <StatusBanner variant="danger" message={error} />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="payment_frequency">Modalidad *</label>
          <select
            id="payment_frequency"
            className="input"
            value={paymentFrequency}
            onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
            disabled={!!loan}
          >
            <option value="monthly">Mensual / por fecha final</option>
            <option value="biweekly">3 quincenas</option>
          </select>
        </div>
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
          <label className="label" htmlFor="interest_rate">
            Tasa de interés (%) {paymentFrequency === 'biweekly' ? '(fija)' : '*'}
          </label>
          <input
            id="interest_rate"
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={paymentFrequency === 'biweekly' ? '20' : interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="10"
            required={paymentFrequency !== 'biweekly'}
            disabled={paymentFrequency === 'biweekly'}
          />
          <p className="mt-1 text-xs text-slate-500">
            {paymentFrequency === 'biweekly'
              ? 'La modalidad a 3 quincenas usa 20% total y lo divide en 3 cobros.'
              : 'Define el porcentaje acordado para este préstamo.'}
          </p>
        </div>
      </div>
      <div className="space-y-1 rounded-lg bg-slate-50 p-4">
        <p className="text-sm text-slate-600">Total a cobrar (calculado)</p>
        <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
        <p className="text-xs text-slate-500">
          Interés (ganancia): {formatCurrency(totalAmount - amountNum)}
        </p>
        {paymentFrequency === 'biweekly' && (
          <p className="text-xs text-slate-500">
            Valor estimado por cuota: {formatCurrency(totalAmount / installmentsCount)}
          </p>
        )}
      </div>
      {!loan && (
        <div>
          <label className="label" htmlFor="amount_paid">
            Monto ya cobrado (opcional)
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            disabled={paymentFrequency === 'biweekly'}
          />
          <p className="mt-1 text-xs text-slate-500">
            {paymentFrequency === 'biweekly'
              ? 'Se calcula automáticamente a 45 días desde la fecha de inicio.'
              : 'Puedes fijar la fecha final acordada con el cliente.'}
          </p>
        </div>
      </div>
      {paymentFrequency === 'biweekly' && biweeklyPreview.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Cronograma estimado de 3 quincenas</p>
          <div className="mt-3 space-y-3">
            {biweeklyPreview.map((item) => (
              <div
                key={item.number}
                className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>Cuota {item.number}</span>
                <span>{item.dueDate}</span>
                <span className="font-medium text-slate-900">{formatCurrency(item.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {loan && (
        <div className="rounded-lg bg-amber-50 p-4">
          <p className="text-sm text-slate-600">Saldo restante</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(remainingBalance)}</p>
        </div>
      )}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
          {saving ? 'Guardando...' : loan ? 'Actualizar préstamo' : 'Crear préstamo'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
