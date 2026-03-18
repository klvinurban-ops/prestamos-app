'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import ClientsTable from '@/components/ClientsTable'
import StatusBanner from '@/components/StatusBanner'
import type { Client } from '@/types/database'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<{ variant: 'success' | 'info'; message: string } | null>(null)

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
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <Link href="/clients/new" className="btn-primary w-full sm:w-fit">
          Nuevo cliente
        </Link>
      </div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono, documento o dirección..."
          className="input w-full sm:max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {search.trim()
            ? `${filtered.length} resultado${filtered.length === 1 ? '' : 's'} para "${search.trim()}".`
            : `${clients.length} cliente${clients.length === 1 ? '' : 's'} en cartera.`}
        </p>
        {search.trim() && (
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setSearch('')}>
            Limpiar búsqueda
          </button>
        )}
      </div>
      {notice && (
        <div className="mb-4">
          <StatusBanner variant={notice.variant} message={notice.message} />
        </div>
      )}
      {loading ? (
        <div className="empty-state">Cargando...</div>
      ) : filtered.length === 0 ? (
        <ClientsTable
          clients={[]}
          emptyTitle={search.trim() ? 'No encontramos coincidencias' : 'No hay clientes'}
          emptyMessage={
            search.trim()
              ? 'Prueba con otro nombre, teléfono, documento o dirección.'
              : 'Crea el primero para comenzar a organizar tu cartera.'
          }
        />
      ) : (
        <ClientsTable
          clients={filtered}
          onDeleted={async (name) => {
            const supabase = getSupabaseBrowser()
            const { data } = await supabase.from('clients').select('*').order('name')
            setClients(data ?? [])
            setNotice({ variant: 'success', message: `Cliente "${name}" eliminado correctamente.` })
          }}
        />
      )}
    </div>
  )
}
