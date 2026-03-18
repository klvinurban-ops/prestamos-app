'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/clients', label: 'Clientes', icon: '👤' },
  { href: '/loans', label: 'Préstamos', icon: '💰' },
  { href: '/payments', label: 'Pagos', icon: '📝' },
  { href: '/overdue', label: 'Vencidos', icon: '⚠️' },
  { href: '/reports', label: 'Reportes', icon: '📈' },
]

type Props = {
  className?: string
  mobile?: boolean
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ className = '', mobile = false, open = false, onClose }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen w-[85vw] max-w-xs border-r border-slate-200 bg-white shadow-xl transition-transform md:z-40 md:w-64 md:max-w-none md:shadow-sm ${
        mobile ? (open ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
      } ${className}`}
      aria-hidden={mobile ? !open : false}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 sm:px-6">
        <Link href="/dashboard" className="text-lg font-bold text-teal-700 sm:text-xl" onClick={onClose}>
          PrestamosPro
        </Link>
        {mobile && (
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        )}
      </div>
      <nav className="space-y-1 p-3 sm:p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-lg" aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
