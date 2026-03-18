'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { buildProjectedMonthlyProfitData, type MonthlyProjection } from '@/lib/loanSchedule'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/format'
import { DashboardCard } from '@/components/DashboardCards'
import MonthlyEarningsChart, { type MonthlyData } from '@/components/MonthlyEarningsChart'
import StatusBanner from '@/components/StatusBanner'
import type { Loan } from '@/types/database'
import type { Payment } from '@/types/database'

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isWithinNextDays(dateStr: string, days: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(dateStr)
  dueDate.setHours(0, 0, 0, 0)
  const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 && diff <= days
}

function isSameDay(dateStr: string, target: Date) {
  const date = new Date(dateStr)
  return date.toDateString() === target.toDateString()
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const [loansRes, paymentsRes] = await Promise.all([
        supabase.from('loans').select('*'),
        supabase.from('payments').select('amount, payment_date'),
      ])
      if (loansRes.data) setLoans(loansRes.data)
      if (paymentsRes.data) setPayments(paymentsRes.data as Payment[])
      setLoading(false)
    }
    load()
  }, [])

  const paymentsTotal = useMemo(
    () => payments.reduce((s, p) => s + Number(p.amount), 0),
    [payments]
  )
  const normalizedLoans = useMemo(() => loans.map((loan) => normalizeLoanStatus(loan)), [loans])
  const totalLent = useMemo(() => loans.reduce((s, l) => s + Number(l.amount), 0), [loans])
  const totalToCollect = useMemo(() => loans.reduce((s, l) => s + Number(l.total_amount), 0), [loans])
  const totalInterest = totalToCollect - totalLent
  const activeLoans = normalizedLoans.filter((l) => l.status === 'active').length
  const overdueLoans = normalizedLoans.filter((l) => l.status === 'overdue').length
  const upcomingLoans = useMemo(
    () =>
      normalizedLoans
        .filter((loan) => loan.status === 'active' && isWithinNextDays(loan.due_date, 15))
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 5),
    [normalizedLoans]
  )
  const openBalance = useMemo(
    () => normalizedLoans
      .filter((loan) => loan.status !== 'paid')
      .reduce((sum, loan) => sum + Number(loan.remaining_balance), 0),
    [normalizedLoans]
  )
  const dueSoonCount = upcomingLoans.length
  const collectedToday = useMemo(() => {
    const today = new Date()
    return payments
      .filter((payment) => isSameDay(payment.payment_date, today))
      .reduce((sum, payment) => sum + Number(payment.amount), 0)
  }, [payments])
  const portfolioStatus = overdueLoans > 0 ? 'Requiere atención' : activeLoans > 0 ? 'Saludable' : 'Sin movimiento'
  const hasPortfolioData = normalizedLoans.length > 0 || payments.length > 0
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const monthlyData: MonthlyData[] = useMemo(() => {
    const byMonth: Record<string, number> = {}
    payments.forEach((p) => {
      const key = getMonthKey(p.payment_date)
      byMonth[key] = (byMonth[key] ?? 0) + Number(p.amount)
    })
    const keys = Object.keys(byMonth).sort()
    if (keys.length === 0) {
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        byMonth[k] = 0
      }
    }
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
  const currentMonthProjection = projectedMonthlyData.find((item) => item.key === currentMonthKey)?.amount ?? 0
  const nextProjectedMonth = projectedMonthlyData.find((item) => item.key >= currentMonthKey && item.amount > 0)
  const projectedAverage = projectedMonthlyData.length
    ? projectedMonthlyData.reduce((sum, item) => sum + item.amount, 0) / projectedMonthlyData.length
    : 0

  if (loading) {
    return (
      <div className="page-shell">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumen ejecutivo de cartera y cobros.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <p className="text-slate-500">Estado general</p>
          <p className="mt-1 font-semibold text-slate-900">{portfolioStatus}</p>
        </div>
      </div>

      <div className="summary-grid mb-6">
        <div className="summary-tile">
          <p className="summary-label">Saldo por cobrar</p>
          <p className="summary-value">{formatCurrency(openBalance)}</p>
          <p className="mt-1 text-xs text-slate-500">Capital vivo fuera de los préstamos pagados.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Cobrado hoy</p>
          <p className="summary-value">{formatCurrency(collectedToday)}</p>
          <p className="mt-1 text-xs text-slate-500">Cobros registrados en la jornada actual.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Próximos 15 días</p>
          <p className="summary-value">{dueSoonCount}</p>
          <p className="mt-1 text-xs text-slate-500">Útil para anticipar seguimiento antes del atraso.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Actualizado</p>
          <p className="summary-value text-lg sm:text-xl">{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="mt-1 text-xs text-slate-500">Datos cargados desde Supabase en esta sesión.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Proyección del mes</p>
          <p className="summary-value">{formatCurrency(currentMonthProjection)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Ganancia estimada para {new Date().toLocaleDateString('es-CO', { month: 'long' })}.
          </p>
        </div>
      </div>

      {!hasPortfolioData && (
        <div className="mb-6">
          <StatusBanner
            variant="info"
            title="Aún no hay datos para analizar"
            message="Crea tus primeros clientes y préstamos para desbloquear métricas, cobros y señales de riesgo."
            action={
              <Link href="/clients/new" className="btn-primary w-full sm:w-auto">
                Crear primer cliente
              </Link>
            }
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashboardCard
          title="Total prestado"
          value={formatCurrency(totalLent)}
          icon="💵"
        />
        <DashboardCard
          title="Total cobrado"
          value={formatCurrency(paymentsTotal)}
          icon="📥"
          variant="success"
        />
        <DashboardCard
          title="Interés total (a ganar)"
          value={formatCurrency(totalInterest)}
          subtitle="Ganancia por todos los préstamos"
          icon="📈"
          variant="success"
        />
        <DashboardCard
          title="Préstamos activos"
          value={activeLoans}
          icon="💰"
        />
        <DashboardCard
          title="Préstamos vencidos"
          value={overdueLoans}
          subtitle={overdueLoans > 0 ? 'Conviene revisar cobranzas hoy.' : 'Sin alertas críticas.'}
          icon="⚠️"
          variant={overdueLoans > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/payments" className="btn-primary">
          Registrar cobro
        </Link>
        <Link href="/overdue" className="btn-secondary">
          Revisar vencidos
        </Link>
        <Link href="/reports" className="btn-secondary">
          Ver reportes
        </Link>
      </div>

      <div className="card mt-6 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Próximos a vencer</h2>
            <p className="mt-1 text-sm text-slate-500">
              Préstamos activos con fecha de vencimiento dentro de los próximos 15 días.
            </p>
          </div>
          <Link href="/loans" className="text-sm font-medium text-teal-600 hover:underline">
            Ver cartera
          </Link>
        </div>
        {upcomingLoans.length === 0 ? (
          <StatusBanner
            variant="info"
            title="No hay vencimientos cercanos"
            message="Cuando un préstamo activo esté próximo a vencer, aparecerá aquí para facilitar el seguimiento."
          />
        ) : (
          <div className="space-y-3">
            {upcomingLoans.map((loan) => (
              <Link
                key={loan.id}
                href={`/loans/${loan.id}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">Vence {new Date(loan.due_date).toLocaleDateString('es-CO')}</p>
                  <p className="text-sm text-slate-500">
                    Saldo pendiente: {formatCurrency(Number(loan.remaining_balance))}
                  </p>
                </div>
                <span className="text-sm font-medium text-teal-600">Abrir préstamo</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-8 p-4 sm:mt-10 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 sm:mb-6">Cobros por mes</h2>
        {payments.length === 0 ? (
          <StatusBanner
            variant="info"
            title="Todavía no hay cobros registrados"
            message="Cuando registres pagos, aquí verás la evolución mensual de tu cartera."
          />
        ) : (
          <MonthlyEarningsChart data={monthlyData} />
        )}
      </div>

      <div className="card mt-6 p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ganancia proyectada por mes</h2>
            <p className="mt-1 text-sm text-slate-500">
              En préstamos mensuales, usa la tasa como ganancia estimada de cada mes del plazo.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
            <p className="text-emerald-700">Promedio mensual proyectado</p>
            <p className="mt-1 font-semibold text-emerald-900">{formatCurrency(projectedAverage)}</p>
            {nextProjectedMonth && (
              <p className="mt-1 text-xs text-emerald-700">
                Próximo pico: {nextProjectedMonth.label} por {formatCurrency(nextProjectedMonth.amount)}
              </p>
            )}
          </div>
        </div>
        {projectedMonthlyData.length === 0 ? (
          <StatusBanner
            variant="info"
            title="No hay proyección disponible todavía"
            message="Crea préstamos con fecha de inicio y vencimiento para estimar la ganancia mensual futura."
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
  )
}
