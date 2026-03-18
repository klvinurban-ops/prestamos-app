'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLoanStatus } from '@/lib/loanStatus'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import LoanForm from '@/components/LoanForm'
import type { Client, Loan, LoanInsert, LoanUpdate } from '@/types/database'

export default function EditLoanPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loan, setLoan] = useState<Loan | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const [loanRes, clientsRes] = await Promise.all([
        supabase.from('loans').select('*').eq('id', id).single(),
        supabase.from('clients').select('*').order('name'),
      ])

      setLoan((loanRes.data as Loan | null) ?? null)
      setClients((clientsRes.data as Client[] | null) ?? [])
      setLoading(false)
    }

    load()
  }, [id])

  async function handleSubmit(data: LoanInsert) {
    const supabase = getSupabaseBrowser()
    const nextStatus = getLoanStatus({
      status: data.status ?? 'active',
      due_date: data.due_date,
      remaining_balance: data.remaining_balance,
    })

    const payload: LoanUpdate = {
      amount: data.amount,
      interest_rate: data.interest_rate,
      total_amount: data.total_amount,
      remaining_balance: data.remaining_balance,
      start_date: data.start_date,
      due_date: data.due_date,
      payment_frequency: data.payment_frequency,
      installments_count: data.installments_count,
      status: nextStatus,
    }

    const { error } = await supabase.from('loans').update(payload as never).eq('id', id)
    if (error) throw new Error(error.message)
    router.push(`/loans/${id}`)
    router.refresh()
  }

  if (loading) return <div className="page-shell">Cargando...</div>
  if (!loan) return <div className="page-shell">Préstamo no encontrado.</div>

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href={`/loans/${id}`} className="text-slate-500 hover:text-slate-700">
          ← Detalle del préstamo
        </Link>
        <h1 className="page-title">Editar préstamo</h1>
      </div>
      <LoanForm
        loan={loan}
        clients={clients}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/loans/${id}`)}
      />
    </div>
  )
}
