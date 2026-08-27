import type { InvoiceStatus } from '@/types';

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  isOverdue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  paid: {
    label: 'Paid',
    bg: 'bg-success-50',
    text: 'text-success-700',
    border: 'border-success-100',
    dot: 'bg-success-500',
  },
  sent: {
    label: 'Sent',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    border: 'border-primary-100',
    dot: 'bg-primary-500',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    border: 'border-danger-100',
    dot: 'bg-danger-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

export function StatusBadge({
  status,
  isOverdue = false,
  size = 'md',
  showDot = true,
  className = '',
}: StatusBadgeProps) {
  const normalizedStatus = isOverdue && status !== 'paid' && status !== 'cancelled' ? 'overdue' : status.toLowerCase();

  const current = statusConfig[normalizedStatus] || {
    label: status.toUpperCase(),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-2xs transition-all ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />}
      {current.label}
    </span>
  );
}

export function StatusDot({
  status,
  isOverdue = false,
  size = 'md',
  className = '',
}: { status: InvoiceStatus | string; isOverdue?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const normalizedStatus = isOverdue && status !== 'paid' && status !== 'cancelled' ? 'overdue' : status.toLowerCase();

  const current = statusConfig[normalizedStatus] || statusConfig.draft;

  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-block rounded-full ${current.dot} ${sizeMap[size]} ${className}`}
      title={current.label}
    />
  );
}