'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import LoansTable from '@/components/LoansTable'
import type { Loan } from '@/types/database'
import type { Client } from '@/types/database'

type LoanWithClient = Loan & { clients: Client | null }

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'paid', label: 'Pagados' },
  { value: 'overdue', label: 'Vencidos' },
]

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const { data } = await supabase
        .from('loans')
        .select('*, clients(*)')
        .order('created_at', { ascending: false })
      const list = (data ?? []) as LoanWithClient[]
      setLoans(list.map((loan) => normalizeLoanStatus(loan)))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!statusFilter) return loans
    return loans.filter((l) => l.status === statusFilter)
  }, [loans, statusFilter])

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Préstamos</h1>
        <Link href="/loans/new" className="btn-primary w-full sm:w-fit">
          Nuevo préstamo
        </Link>
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <label className="text-sm font-medium text-slate-700">Estado:</label>
        <select
          className="input w-full min-w-[140px] sm:w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : (
        <LoansTable loans={filtered} />
      )}
    </div>
  )
}
