import type { DateRange } from '@/utils/analyticsCalculations'

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  onCustomChange?: (start: string, end: string) => void
}

const ranges: { value: DateRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: 'year', label: 'Year' },
]

export function DateRangeFilter({ value, onChange, onCustomChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
        {ranges.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => onChange(range.value)}
            className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
              value === range.value ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
      {value === 'custom' && onCustomChange && (
        <div className="flex items-center space-x-2">
          <input
            type="date"
            onChange={(e) => onCustomChange(e.target.value, '')}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600"
          />
          <span className="text-xs text-slate-500">to</span>
          <input
            type="date"
            onChange={(e) => onCustomChange('', e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600"
          />
        </div>
      )}
    </div>
  )
}