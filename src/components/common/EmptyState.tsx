import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div
      className={`text-center rounded-2xl border border-slate-200/80 bg-white shadow-2xs my-4 ${
        size === 'sm' ? 'py-10 px-4' : size === 'lg' ? 'py-16 px-6' : 'py-12 px-4'
      }`}
    >
      <div
        className={`mx-auto rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-5 shadow-2xs ${
          size === 'sm'
            ? 'w-12 h-12'
            : size === 'lg'
            ? 'w-16 h-16'
            : 'w-14 h-14'
        }`}
      >
        {icon || <Inbox className={size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'} />}
      </div>
      <h3
        className={`font-bold text-slate-900 ${
          size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-slate-500 mx-auto ${
          size === 'lg'
            ? 'mt-2 max-w-lg text-sm'
            : size === 'sm'
            ? 'mt-1 max-w-xs text-xs'
            : 'mt-1 max-w-sm text-sm'
        }`}
      >
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}