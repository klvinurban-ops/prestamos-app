'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabaseClient'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      router.push(redirectTo)
      router.refresh()
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e ?? '')).toLowerCase()
      if (msg.includes('faltan variables') || msg.includes('.env.local')) {
        setError('Configuración incompleta: falta .env.local con la URL y clave de Supabase. Ver SETUP-SUPABASE.md.')
      } else if (msg.includes('fetch') || msg.includes('connection') || msg.includes('network') || msg.includes('failed')) {
        setError('No se pudo conectar a Supabase. Comprueba: 1) Internet. 2) En app.supabase.com que tu proyecto esté ACTIVO (no en pausa). 3) Si está en pausa, clic en "Restore project".')
      } else {
        setError((e instanceof Error ? e.message : String(e)) || 'Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-teal-700">
            PrestamosPro
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Gestión de préstamos personales
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="label">Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Solo usuarios autenticados pueden acceder a la aplicación.
        </p>
        <p className="mt-3 text-center text-xs text-amber-700 bg-amber-50 rounded p-2">
          Si ves &quot;Failed to fetch&quot;: entra en app.supabase.com y asegúrate de que el proyecto esté activo (no en pausa).
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-100">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
