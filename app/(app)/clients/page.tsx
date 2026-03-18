'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import ClientsTable from '@/components/ClientsTable'
import type { Client } from '@/types/database'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser()
      const { data } = await supabase.from('clients').select('*').order('name')
      setClients(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.trim().toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone?.toLowerCase().includes(q)) ||
        (c.document?.toLowerCase().includes(q)) ||
        (c.address?.toLowerCase().includes(q))
    )
  }, [clients, search])

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <Link href="/clients/new" className="btn-primary w-fit">
          Nuevo cliente
        </Link>
      </div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono, documento o dirección..."
          className="input max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="card p-8 text-center text-slate-500">Cargando...</div>
      ) : (
        <ClientsTable
          clients={filtered}
          onDeleted={async () => {
            const supabase = getSupabaseBrowser()
            const { data } = await supabase.from('clients').select('*').order('name')
            setClients(data ?? [])
          }}
        />
      )}
    </div>
  )
}
