'use client'

import { useEffect, useState, useMemo } from 'react'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/format'
import { DashboardCard } from '@/components/DashboardCards'
import MonthlyEarningsChart, { type MonthlyData } from '@/components/MonthlyEarningsChart'
import type { Loan } from '@/types/database'
import type { Payment } from '@/types/database'

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
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

  if (loading) {
    return (
      <div className="p-8">
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
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Dashboard</h1>
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
          icon="⚠️"
          variant={overdueLoans > 0 ? 'danger' : 'default'}
        />
      </div>
      <div className="mt-10 card p-6">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Cobros por mes</h2>
        <MonthlyEarningsChart data={monthlyData} />
      </div>
    </div>
  )
}
