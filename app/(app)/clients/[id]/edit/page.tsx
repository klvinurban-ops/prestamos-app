'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import ClientForm from '@/components/ClientForm'
import type { Client, ClientInsert, ClientUpdate } from '@/types/database'

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const { data } = await supabase.from('clients').select('*').eq('id', id).single()
      setClient(data ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(data: ClientInsert) {
    const supabase = getSupabaseBrowser()
    const { id: _id, ...rest } = data
    const payload: ClientUpdate = { name: rest.name, phone: rest.phone ?? null, document: rest.document ?? null, address: rest.address ?? null, notes: rest.notes ?? null }
    const { error } = await supabase.from('clients').update(payload as never).eq('id', id)
    if (error) throw new Error(error.message)
    router.push(`/clients/${id}`)
    router.refresh()
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (!client) return <div className="p-8">Cliente no encontrado.</div>

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/clients/${id}`} className="text-slate-500 hover:text-slate-700">
          ← Perfil
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar cliente</h1>
      </div>
      <ClientForm
        client={client}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/clients/${id}`)}
      />
    </div>
  )
}
