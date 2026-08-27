interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ text = 'Loading...', size = 'md' }: LoadingProps) {
  const spinnerSizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative flex items-center justify-center">
        <div className={`${spinnerSizes[size]} border-primary-100 border-t-primary-600 rounded-full animate-spin`} />
      </div>
      {text && (
        <span className="mt-4 text-xs font-medium text-slate-500 tracking-wide">{text}</span>
      )}
    </div>
  );
}