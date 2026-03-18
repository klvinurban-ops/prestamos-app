'use client'

type Props = {
  title?: string
  message: string
  variant?: 'info' | 'success' | 'warning' | 'danger'
  action?: React.ReactNode
}

const styles = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
}

export default function StatusBanner({
  title,
  message,
  variant = 'info',
  action,
}: Props) {
  return (
    <div className={`rounded-xl border p-4 ${styles[variant]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {title && <p className="text-sm font-semibold">{title}</p>}
          <p className={`text-sm ${title ? 'mt-1' : ''}`}>{message}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
