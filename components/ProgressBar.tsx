'use client'

type Props = {
  value: number
  label?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const tones = {
  default: 'bg-teal-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export default function ProgressBar({ value, label, tone = 'default' }: Props) {
  const width = Math.min(100, Math.max(0, value))

  return (
    <div>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-900">{Math.round(width)}%</span>
        </div>
      ) : null}
      <div className="h-2.5 rounded-full bg-slate-200">
        <div
          className={`h-2.5 rounded-full transition-all ${tones[tone]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}
