import { formatCurrency } from '@/utils/invoiceCalculations'

interface CollectionRateCardProps {
  rate: number
  collected: number
  total: number
  currency: string
  title?: string
}

export function CollectionRateCard({ rate, collected, total, currency, title = 'Collection Rate' }: CollectionRateCardProps) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (rate / 100) * circumference
  const strokeDasharray = `${circumference} ${circumference}`

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
      <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#2563eb"
              strokeWidth="10"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="transition-all duration-700 ease-out"
            />
            <text x="60" y="56" textAnchor="middle" className="text-lg fill-slate-900 font-bold">
              {rate}%
            </text>
            <text x="60" y="68" textAnchor="middle" className="text-[10px] fill-slate-500">
              collected
            </text>
          </svg>
        </div>
        <div className="mt-4 space-y-1 text-center">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{formatCurrency(collected, currency)}</span> collected
          </p>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{formatCurrency(total, currency)}</span> total
          </p>
        </div>
      </div>
    </div>
  )
}