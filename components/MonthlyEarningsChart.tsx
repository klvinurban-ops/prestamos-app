'use client'

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
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v)}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
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
