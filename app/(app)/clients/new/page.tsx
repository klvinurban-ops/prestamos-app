'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import ClientForm from '@/components/ClientForm'
import type { ClientInsert } from '@/types/database'

export default function NewClientPage() {
  const router = useRouter()

  async function handleSubmit(data: ClientInsert) {
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.from('clients').insert(data as never)
    if (error) throw new Error(error.message)
    router.push('/clients')
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/clients" className="text-slate-500 hover:text-slate-700">
          ← Clientes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo cliente</h1>
      </div>
      <ClientForm onSubmit={handleSubmit} onCancel={() => router.push('/clients')} />
    </div>
  )
}
