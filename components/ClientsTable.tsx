'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabaseClient'
import type { Client } from '@/types/database'

type Props = {
  clients: Client[]
  onDeleted?: () => void
}

export default function ClientsTable({ clients, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar cliente "${name}"? Se eliminarán también sus préstamos y pagos.`)) return
    setDeletingId(id)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw new Error(error.message)
      onDeleted?.()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        No hay clientes. <Link href="/clients/new" className="text-teal-600 hover:underline">Crear el primero</Link>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-700">Nombre</th>
              <th className="px-4 py-3 font-medium text-slate-700">Teléfono</th>
              <th className="px-4 py-3 font-medium text-slate-700">Documento</th>
              <th className="px-4 py-3 font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/clients/${c.id}`} className="text-teal-600 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.document || '—'}</td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <Link href={`/clients/${c.id}/edit`} className="text-teal-600 hover:underline">
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={deletingId === c.id}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingId === c.id ? '...' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
