'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/format'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import LoansTable from '@/components/LoansTable'
import StatusBanner from '@/components/StatusBanner'
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
  const [search, setSearch] = useState('')

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
    const query = search.trim().toLowerCase()
    return loans.filter((loan) => {
      const matchesStatus = !statusFilter || loan.status === statusFilter
      const matchesSearch =
        !query ||
        (loan.clients?.name ?? '').toLowerCase().includes(query) ||
        loan.due_date.includes(query)

      return matchesStatus && matchesSearch
    })
  }, [loans, search, statusFilter])
  const totalPending = useMemo(
    () => loans.filter((loan) => loan.status !== 'paid').reduce((sum, loan) => sum + Number(loan.remaining_balance), 0),
    [loans]
  )
  const activeCount = useMemo(() => loans.filter((loan) => loan.status === 'active').length, [loans])
  const overdueCount = useMemo(() => loans.filter((loan) => loan.status === 'overdue').length, [loans])

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Préstamos</h1>
        <Link href="/loans/new" className="btn-primary w-full sm:w-fit">
          Nuevo préstamo
        </Link>
      </div>
      <div className="summary-grid mb-6">
        <div className="summary-tile">
          <p className="summary-label">Saldo vivo</p>
          <p className="summary-value">{formatCurrency(totalPending)}</p>
          <p className="mt-1 text-xs text-slate-500">Importe aún pendiente de cobro.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Activos</p>
          <p className="summary-value">{activeCount}</p>
          <p className="mt-1 text-xs text-slate-500">Préstamos al día y en seguimiento normal.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Vencidos</p>
          <p className="summary-value">{overdueCount}</p>
          <p className="mt-1 text-xs text-slate-500">Casos que conviene priorizar hoy.</p>
        </div>
        <div className="summary-tile">
          <p className="summary-label">Mostrando</p>
          <p className="summary-value">{filtered.length}</p>
          <p className="mt-1 text-xs text-slate-500">Resultados visibles con los filtros actuales.</p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label className="label" htmlFor="loan-search">Buscar</label>
          <input
            id="loan-search"
            type="search"
            className="input"
            placeholder="Buscar por cliente o fecha de vencimiento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="loan-status">Estado</label>
          <select
            id="loan-status"
            className="input w-full min-w-[160px] lg:w-auto"
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
      </div>

      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : filtered.length === 0 ? (
        <StatusBanner
          variant={search.trim() || statusFilter ? 'warning' : 'info'}
          title={search.trim() || statusFilter ? 'No hay préstamos con esos filtros' : 'Todavía no hay préstamos'}
          message={
            search.trim() || statusFilter
              ? 'Prueba limpiando la búsqueda o cambiando el estado seleccionado.'
              : 'Cuando registres el primer préstamo, aquí aparecerá la cartera activa.'
          }
          action={
            search.trim() || statusFilter ? (
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                }}
              >
                Limpiar filtros
              </button>
            ) : (
              <Link href="/loans/new" className="btn-primary w-full sm:w-auto">
                Crear préstamo
              </Link>
            )
          }
        />
      ) : (
        <LoansTable loans={filtered} />
      )}
    </div>
  )
}
