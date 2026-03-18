'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import LoanForm from '@/components/LoanForm'
import type { Client } from '@/types/database'

export default function NewLoanPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const { data } = await supabase.from('clients').select('*').order('name')
      setClients(data ?? [])
    }
    load()
  }, [])

  async function handleSubmit(data: {
    client_id: string
    amount: number
    interest_rate: number
    total_amount: number
    remaining_balance: number
    start_date: string
    due_date: string
    status: 'active' | 'paid' | 'overdue'
  }) {
    const supabase = getSupabaseBrowser()
    // @ts-expect-error - Supabase client insert() infers never with current typings
    const { error } = await supabase.from('loans').insert(data)
    if (error) throw new Error(error.message)
    router.push('/loans')
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/loans" className="text-slate-500 hover:text-slate-700">
          ← Préstamos
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo préstamo</h1>
      </div>
      <LoanForm
        clients={clients}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/loans')}
      />
    </div>
  )
}
