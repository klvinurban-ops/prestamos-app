'use client'

type CardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: 'border-slate-200 bg-white',
  success: 'border-emerald-200 bg-emerald-50/50',
  warning: 'border-amber-200 bg-amber-50/50',
  danger: 'border-red-200 bg-red-50/50',
}

export function DashboardCard({ title, value, subtitle, icon, variant = 'default' }: CardProps) {
  return (
    <div className={`card p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <span className="text-3xl" aria-hidden>{icon}</span>
      </div>
    </div>
  )
}
