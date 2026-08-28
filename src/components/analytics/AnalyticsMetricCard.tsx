import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface AnalyticsMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  growth?: {
    value: number
    label?: string
  }
  icon?: ReactNode
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'slate' | 'indigo'
  className?: string
  onClick?: () => void
}

const iconColorMap = {
  primary: 'bg-primary-50 text-primary-600 border-primary-100',
  success: 'bg-success-50 text-success-600 border-success-100',
  warning: 'bg-warning-50 text-warning-600 border-warning-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
}

export function AnalyticsMetricCard({
  title,
  value,
  subtitle,
  growth,
  icon,
  iconColor = 'primary',
  className = '',
  onClick,
}: AnalyticsMetricCardProps) {
  const growthInfo = growth
    ? {
        positive: growth.value >= 0,
        text: `${growth.value >= 0 ? '+' : ''}${growth.value.toFixed(1)}%`,
        label: growth.label || (growth.value >= 0 ? 'growth' : 'decline'),
      }
    : null

  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {icon && (
          <div className={`p-2 rounded-xl border ${iconColorMap[iconColor]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {growthInfo && (
        <div className={`flex items-center mt-2 text-xs font-semibold ${growthInfo.positive ? 'text-success-600' : 'text-danger-600'}`}>
          {growthInfo.positive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
          <span>
            {growthInfo.text} {growthInfo.label}
          </span>
        </div>
      )}
    </div>
  )
}