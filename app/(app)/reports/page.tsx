'use client'

import { useEffect, useState, useMemo } from 'react'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import {
  buildProjectedMonthlyProfitData,
  getLoanFrequencyLabel,
  getLoanInstallmentsCount,
  type MonthlyProjection,
} from '@/lib/loanSchedule'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency, formatDate, loanInterest } from '@/lib/format'
import MonthlyEarningsChart, { type MonthlyData } from '@/components/MonthlyEarningsChart'
import StatusBanner from '@/components/StatusBanner'
import type { Loan } from '@/types/database'
import type { Payment } from '@/types/database'
import type { Client } from '@/types/database'

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ReportsPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const [loansRes, paymentsRes, clientsRes] = await Promise.all([
        supabase.from('loans').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('clients').select('id'),
      ])
      setLoans((loansRes.data ?? []) as Loan[])
      setPayments((paymentsRes.data ?? []) as Payment[])
      setClients((clientsRes.data ?? []) as Client[])
      setLoading(false)
    }
    load()
  }, [])

  const totalLent = useMemo(() => loans.reduce((s, l) => s + Number(l.amount), 0), [loans])
  const totalCollected = useMemo(() => payments.reduce((s, p) => s + Number(p.amount), 0), [payments])
  const totalInterestEarned = useMemo(() => {
    const totalToCollect = loans.reduce((s, l) => s + Number(l.total_amount), 0)
    const totalPrincipal = loans.reduce((s, l) => s + Number(l.amount), 0)
    return totalToCollect - totalPrincipal
  }, [loans])
  const normalizedLoans = useMemo(() => loans.map((loan) => normalizeLoanStatus(loan)), [loans])
  const activeLoans = normalizedLoans.filter((l) => l.status === 'active').length
  const paidLoans = normalizedLoans.filter((l) => l.status === 'paid').length
  const overdueLoans = normalizedLoans.filter((l) => l.status === 'overdue').length

  const monthlyCollectedData: MonthlyData[] = useMemo(() => {
    const byMonth: Record<string, number> = {}
    payments.forEach((p) => {
      const key = getMonthKey(p.payment_date)
      byMonth[key] = (byMonth[key] ?? 0) + Number(p.amount)
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => {
        const [y, m] = month.split('-')
        const label = `${MONTHS_ES[parseInt(m, 10) - 1]} ${y}`
        return { month: label, amount, label }
      })
  }, [payments])
  const projectedMonthlyData: MonthlyProjection[] = useMemo(
    () => buildProjectedMonthlyProfitData(normalizedLoans),
    [normalizedLoans]
  )
  const projectedTotal = useMemo(
    () => projectedMonthlyData.reduce((sum, item) => sum + item.amount, 0),
    [projectedMonthlyData]
  )
  const bestProjectedMonth = projectedMonthlyData.reduce<MonthlyData | null>(
    (best, item) => (!best || item.amount > best.amount ? item : best),
    null
  )

  function handleExport() {
    const lines = [
      'PrestamosPro - Reporte',
      `Generado: ${new Date().toLocaleString('es')}`,
      '',
      'Resumen',
      `Total prestado,${formatCurrency(totalLent)}`,
      `Total cobrado,${formatCurrency(totalCollected)}`,
      `Interés total (a ganar),${formatCurrency(totalInterestEarned)}`,
      `Ganancia proyectada visible,${formatCurrency(projectedTotal)}`,
      `Préstamos activos,${activeLoans}`,
      `Préstamos pagados,${paidLoans}`,
      `Préstamos vencidos,${overdueLoans}`,
      `Clientes,${clients.length}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prestamospro-reporte-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="page-shell">Cargando...</div>
  }

  return (
    <div className="page-shell">
      <div className="page-header mb-8">
        <h1 className="page-title">Reportes</h1>
        <button type="button" onClick={handleExport} className="btn-primary w-full sm:w-auto">
          Exportar reporte
        </button>
      </div>

      <div className="card mb-8 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Resumen general</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm text-slate-500">Total prestado</dt>
            <dd className="text-xl font-bold text-slate-900">{formatCurrency(totalLent)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Total cobrado</dt>
            <dd className="text-xl font-bold text-slate-900">{formatCurrency(totalCollected)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Interés total (a ganar)</dt>
            <dd className="text-xl font-bold text-slate-900">{formatCurrency(totalInterestEarned)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Clientes</dt>
            <dd className="text-xl font-bold text-slate-900">{clients.length}</dd>
          </div>
        </dl>
      </div>

      <div className="card mb-8 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Rendimiento de préstamos</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500">Activos</dt>
            <dd className="text-2xl font-bold text-emerald-600">{activeLoans}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Pagados</dt>
            <dd className="text-2xl font-bold text-slate-700">{paidLoans}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Vencidos</dt>
            <dd className="text-2xl font-bold text-red-600">{overdueLoans}</dd>
          </div>
        </dl>
      </div>

      <div className="card mb-8 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Ganancias por préstamo (fecha, monto, %, interés)</h2>
        <div className="space-y-3 md:hidden">
          {normalizedLoans.map((l) => (
            <div key={l.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{formatCurrency(Number(l.amount))}</p>
                  <p className="text-sm text-slate-500">{formatDate(l.start_date)} - {formatDate(l.due_date)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {l.status}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Modalidad</dt>
                  <dd className="font-medium text-slate-900">{getLoanFrequencyLabel(l)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cuotas</dt>
                  <dd className="font-medium text-slate-900">
                    {l.payment_frequency === 'biweekly' ? getLoanInstallmentsCount(l) : 'Fecha final'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tasa</dt>
                  <dd className="font-medium text-slate-900">{Number(l.interest_rate)}%</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Interés</dt>
                  <dd className="font-medium text-emerald-600">
                    {formatCurrency(loanInterest(Number(l.total_amount), Number(l.amount)))}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Inicio</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Vencimiento</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Monto</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Modalidad</th>
                  <th className="px-4 py-3 font-medium text-slate-700">%</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Total</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Interés (ganancia)</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {normalizedLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-600">{formatDate(l.start_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(l.due_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.amount))}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {getLoanFrequencyLabel(l)}
                      {l.payment_frequency === 'biweekly' ? ` (${getLoanInstallmentsCount(l)} cuotas)` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{Number(l.interest_rate)}%</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.total_amount))}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      {formatCurrency(loanInterest(Number(l.total_amount), Number(l.amount)))}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 sm:mb-6">Cobros mensuales reales</h2>
          {monthlyCollectedData.length === 0 ? (
            <StatusBanner
              variant="info"
              title="Aún no hay cobros para este gráfico"
              message="Cuando registres pagos, aquí verás el comportamiento real mes a mes."
            />
          ) : (
            <MonthlyEarningsChart data={monthlyCollectedData} valueLabel="Cobro real" />
          )}
        </div>

        <div className="card p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ganancia proyectada por mes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Proyección distribuida según fecha final o cronograma de 3 quincenas.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-emerald-700">Ganancia proyectada visible</p>
              <p className="mt-1 font-semibold text-emerald-900">{formatCurrency(projectedTotal)}</p>
              {bestProjectedMonth && (
                <p className="mt-1 text-xs text-emerald-700">
                  Mejor mes: {bestProjectedMonth.label} con {formatCurrency(bestProjectedMonth.amount)}
                </p>
              )}
            </div>
          </div>
          {projectedMonthlyData.length === 0 ? (
            <StatusBanner
              variant="info"
              title="No hay proyección disponible"
              message="Necesitas préstamos con montos y fechas definidas para estimar ganancias futuras."
            />
          ) : (
            <MonthlyEarningsChart
              data={projectedMonthlyData}
              valueLabel="Ganancia proyectada"
              barColor="#16a34a"
            />
          )}
        </div>
      </div>
    </div>
  )
}
