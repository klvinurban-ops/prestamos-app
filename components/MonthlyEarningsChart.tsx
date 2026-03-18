'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

export type MonthlyData = { month: string; amount: number; label: string }

type Props = {
  data: MonthlyData[]
}

export default function MonthlyEarningsChart({ data }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function updateViewport() {
      setIsMobile(window.innerWidth < 640)
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return (
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: isMobile ? -24 : 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }}
            tickLine={false}
            interval={isMobile ? 1 : 0}
          />
          <YAxis
            tickFormatter={(v) => (isMobile ? formatCurrency(v).replace('COP', '').trim() : formatCurrency(v))}
            tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }}
            tickLine={false}
            width={isMobile ? 44 : 60}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Cobrado']}
            labelFormatter={(_, payload) => payload[0]?.payload?.label ?? ''}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="amount" fill="#0f766e" radius={[4, 4, 0, 0]} name="Cobrado" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
