'use client'

import { useState } from 'react'
import type { Client, ClientInsert } from '@/types/database'

type Props = {
  client?: Client | null
  onSubmit: (data: ClientInsert) => Promise<void>
  onCancel?: () => void
}

export default function ClientForm({ client, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(client?.name ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [document, setDocument] = useState(client?.document ?? '')
  const [address, setAddress] = useState(client?.address ?? '')
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim() || null,
        document: document.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="label" htmlFor="name">Nombre *</label>
        <input
          id="name"
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="phone">Teléfono</label>
        <input
          id="phone"
          type="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
        />
      </div>
      <div>
        <label className="label" htmlFor="document">Número de identificación</label>
        <input
          id="document"
          type="text"
          className="input"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          placeholder="DNI / Cédula / Pasaporte"
        />
      </div>
      <div>
        <label className="label" htmlFor="address">Dirección</label>
        <input
          id="address"
          type="text"
          className="input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Dirección"
        />
      </div>
      <div>
        <label className="label" htmlFor="notes">Notas</label>
        <textarea
          id="notes"
          className="input min-h-[80px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales"
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : client ? 'Actualizar cliente' : 'Crear cliente'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
