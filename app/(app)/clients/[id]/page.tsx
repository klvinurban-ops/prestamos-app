'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { normalizeLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import { formatCurrency, formatDate, loanInterest } from '@/lib/format'
import type { Client } from '@/types/database'
import type { Loan } from '@/types/database'

const statusLabels: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  overdue: 'Vencido',
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-slate-100 text-slate-700',
  overdue: 'bg-red-100 text-red-800',
}

export default function ClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const [clientRes, loansRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('loans').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      setClient(clientRes.data ?? null)
      setLoans(((loansRes.data ?? []) as Loan[]).map((loan) => normalizeLoanStatus(loan)))
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-8">Cargando...</div>
  if (!client) return <div className="p-8">Cliente no encontrado.</div>

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/clients" className="text-slate-500 hover:text-slate-700">
          ← Clientes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
        <Link href={`/clients/${id}/edit`} className="btn-primary">
          Editar
        </Link>
      </div>

      <div className="card mb-8 overflow-hidden p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Información</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Teléfono</dt>
            <dd className="font-medium text-slate-900">{client.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Documento</dt>
            <dd className="font-medium text-slate-900">{client.document || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-slate-500">Dirección</dt>
            <dd className="font-medium text-slate-900">{client.address || '—'}</dd>
          </div>
          {client.notes && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Notas</dt>
              <dd className="font-medium text-slate-900">{client.notes}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-slate-500">Registrado</dt>
            <dd className="font-medium text-slate-900">{formatDate(client.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Préstamos</h2>
        <Link href="/loans/new" className="btn-secondary text-sm">
          Nuevo préstamo
        </Link>
      </div>
      {loans.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          Sin préstamos. <Link href="/loans/new" className="text-teal-600 hover:underline">Crear préstamo</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Inicio</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Vencimiento</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Monto</th>
                  <th className="px-4 py-3 font-medium text-slate-700">%</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Total</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Interés</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Saldo</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Estado</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-600">{formatDate(l.start_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(l.due_date)}</td>
                    <td className="px-4 py-3 text-slate-900">{formatCurrency(Number(l.amount))}</td>
                    <td className="px-4 py-3 text-slate-600">{Number(l.interest_rate)}%</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.total_amount))}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">
                      {formatCurrency(loanInterest(Number(l.total_amount), Number(l.amount)))}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(l.remaining_balance))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusStyles[l.status] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {statusLabels[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/loans/${l.id}`} className="text-teal-600 hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
