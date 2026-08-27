export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
      {text && <span className="mt-3 text-xs font-medium text-slate-500 tracking-wide">{text}</span>}
    </div>
  )
}
