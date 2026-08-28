import { useMemo } from 'react'

interface InvoiceStatusChartProps {
  paid: number
  pending: number
  sent: number
  overdue: number
  currency: string
  paidCount: number
  pendingCount: number
  sentCount: number
  overdueCount: number
}

const COLORS = {
  paid: '#16a34a',
  pending: '#64748b',
  sent: '#2563eb',
  overdue: '#dc2626',
}

interface ChartSegment {
  label: string
  value: number
  count: number
  color: string
  path: string
  percentage: string
}

export function InvoiceStatusChart({
  paid,
  pending,
  sent,
  overdue,
  currency,
  paidCount,
  pendingCount,
  sentCount,
  overdueCount,
}: InvoiceStatusChartProps) {
  const total = paid + pending + sent + overdue

  const { segments, centerText }: { segments: ChartSegment[]; centerText: { label: string; value: string } } = useMemo(() => {
    if (total === 0) {
      return {
        segments: [] as ChartSegment[],
        centerText: { label: 'No Data', value: '0%' },
      }
    }

    const rawSegments: Omit<ChartSegment, 'path' | 'percentage'>[] = [
      { label: 'Paid', value: paid, count: paidCount, color: COLORS.paid },
      { label: 'Pending', value: pending, count: pendingCount, color: COLORS.pending },
      { label: 'Sent', value: sent, count: sentCount, color: COLORS.sent },
      { label: 'Overdue', value: overdue, count: overdueCount, color: COLORS.overdue },
    ].filter((s) => s.value > 0)

    let currentAngle = -90

    const chartSegments: ChartSegment[] = rawSegments.map((segment) => {
      const angle = (segment.value / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1 = 60 + 52 * Math.cos(startRad)
      const y1 = 60 + 52 * Math.sin(startRad)
      const x2 = 60 + 52 * Math.cos(endRad)
      const y2 = 60 + 52 * Math.sin(endRad)

      const largeArc = angle > 180 ? 1 : 0

      return {
        ...segment,
        path: `M 60 60 L ${x1} ${y1} A 52 52 0 ${largeArc} 1 ${x2} ${y2} Z`,
        percentage: ((segment.value / total) * 100).toFixed(1),
      }
    })

    const centerLabel = rawSegments.length > 0 ? rawSegments[0].label : 'No Data'
    const centerValue = rawSegments.length > 0 ? `${chartSegments[0].percentage}%` : '0%'

    return { segments: chartSegments, centerText: { label: centerLabel, value: centerValue } }
  }, [paid, pending, sent, overdue, total])

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Paid vs Pending Ratio</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 120 120">
            {segments.map((segment, i) => (
              <path key={i} d={segment.path} fill={segment.color} stroke="#ffffff" strokeWidth="2" />
            ))}
            <circle cx="60" cy="60" r="36" fill="#ffffff" />
            <text x="60" y="56" textAnchor="middle" className="text-[10px] fill-slate-500 font-semibold">
              {centerText.label}
            </text>
            <text x="60" y="68" textAnchor="middle" className="text-xs fill-slate-900 font-bold">
              {centerText.value}
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-3">
          {segments.length === 0 && (
            <p className="text-xs text-slate-500">No invoice data available for this period.</p>
          )}
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-xs font-medium text-slate-700">{segment.label}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(segment.value)}</span>
                <span className="text-[10px] text-slate-500 ml-1">({segment.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}