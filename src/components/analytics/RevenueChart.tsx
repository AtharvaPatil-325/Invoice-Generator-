import { useMemo } from 'react'
import type { RevenueDataPoint } from '@/utils/analyticsCalculations'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  currency: string
  height?: number
  timeRange: string
}

export function RevenueChart({ data, currency, height = 280, timeRange }: RevenueChartProps) {
  const { svgWidth, svgHeight, points, areaPath, gradientId, padding, chartHeight } = useMemo(() => {
    const width = 800
    const svgH = height
    const pad = { top: 20, right: 20, bottom: 40, left: 60 }
    const cw = width - pad.left - pad.right
    const ch = svgH - pad.top - pad.bottom

    const maxValue = Math.max(...data.map((d) => d.value), 1)
    const minValue = 0

    const xStep = data.length > 1 ? cw / (data.length - 1) : cw

    const pts = data.map((d, i) => {
      const x = pad.left + i * xStep
      const y = pad.top + ch - ((d.value - minValue) / (maxValue - minValue || 1)) * ch
      return { x, y, value: d.value, label: d.label }
    })

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = `${linePath} L ${pts[pts.length - 1].x} ${pad.top + ch} L ${pts[0].x} ${pad.top + ch} Z`

    return {
      svgWidth: width,
      svgHeight: svgH,
      points: pts,
      areaPath: area,
      gradientId: `chartGradient-${timeRange}`,
      padding: pad,
      chartHeight: ch,
    }
  }, [data, height, timeRange])

  if (data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-slate-500" style={{ height }}>
        No revenue data available for this period.
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ height, minWidth: 320 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding.top + chartHeight - tick * chartHeight
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400">
                {new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format((Math.max(...data.map((d) => d.value), 1) * tick))}
              </text>
            </g>
          )
        })}

        {/* Area */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points and tooltips */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
            <title>{`${p.label}: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(p.value)}`}</title>
          </g>
        ))}

        {/* X axis labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={svgHeight - 12} textAnchor="middle" className="text-[11px] fill-slate-500 font-medium">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  )
}