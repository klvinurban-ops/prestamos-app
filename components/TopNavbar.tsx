'use client'

import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabaseClient'

type Props = {
  userEmail?: string | null
  onMenuClick?: () => void
}

export default function TopNavbar({ userEmail, onMenuClick }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <span className="truncate text-sm font-semibold text-slate-700">PrestamosPro</span>
      </div>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {userEmail && (
          <span className="hidden max-w-[180px] truncate text-sm text-slate-500 sm:inline" title={userEmail}>
            {userEmail}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost px-2 text-sm text-slate-600 hover:text-slate-900 sm:px-4"
        >
          <span className="hidden sm:inline">Cerrar sesión</span>
          <span className="sm:hidden">Salir</span>
        </button>
      </div>
    </header>
  )
}
