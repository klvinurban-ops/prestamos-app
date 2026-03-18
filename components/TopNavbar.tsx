'use client'

import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabaseClient'

type Props = {
  userEmail?: string | null
}

export default function TopNavbar({ userEmail }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-600">PrestamosPro</span>
      </div>
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-sm text-slate-500" title={userEmail}>
            {userEmail}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost text-sm text-slate-600 hover:text-slate-900"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
