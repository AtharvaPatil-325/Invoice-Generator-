export function Skeleton({
  className = '',
  variant = 'rect',
}: { className?: string; variant?: 'rect' | 'circle' | 'text' }) {
  const base = 'skeleton-shimmer';
  const shapes = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded-md h-3',
  };

  return <div className={`${base} ${shapes[variant]} ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3 flex-1">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 hidden sm:block" />
            <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}