import type { InvoiceStatus } from '@/types'

interface StatusBadgeProps {
  status: InvoiceStatus | string
  isOverdue?: boolean
  className?: string
}

export function StatusBadge({ status, isOverdue = false, className = '' }: StatusBadgeProps) {
  const normalizedStatus = isOverdue && status !== 'paid' && status !== 'cancelled' ? 'overdue' : status.toLowerCase()

  const config: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    paid: {
      label: 'Paid',
      bg: 'bg-emerald-50 border-emerald-200/60',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    sent: {
      label: 'Sent',
      bg: 'bg-blue-50 border-blue-200/60',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    draft: {
      label: 'Draft',
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
    },
    overdue: {
      label: 'Overdue',
      bg: 'bg-rose-50 border-rose-200/60',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-gray-100 border-gray-200',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
    },
  }

  const current = config[normalizedStatus] || {
    label: status.toUpperCase(),
    bg: 'bg-gray-100 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-2xs transition-all ${current.bg} ${current.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
      {current.label}
    </span>
  )
}
