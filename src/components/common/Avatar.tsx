interface AvatarProps {
  name?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ name, email, size = 'md', className = '' }: AvatarProps) {
  const text = name || email || 'U'
  const initials = text
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Generate a consistent gradient background based on text char code sum
  const charSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const gradients = [
    'from-blue-600 to-indigo-600 text-white',
    'from-indigo-600 to-purple-600 text-white',
    'from-violet-600 to-fuchsia-600 text-white',
    'from-sky-500 to-blue-600 text-white',
    'from-emerald-500 to-teal-700 text-white',
  ]
  const gradient = gradients[charSum % gradients.length]

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs font-semibold',
    md: 'w-9 h-9 text-sm font-semibold',
    lg: 'w-11 h-11 text-base font-semibold',
    xl: 'w-14 h-14 text-lg font-bold',
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-linear-to-br shadow-2xs border border-white/20 select-none shrink-0 ${gradient} ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  )
}
