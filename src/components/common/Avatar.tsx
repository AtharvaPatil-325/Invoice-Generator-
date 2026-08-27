interface AvatarProps {
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  src?: string | null;
  alt?: string;
}

export function Avatar({ name, email, size = 'md', className = '', src, alt }: AvatarProps) {
  const text = name || email || 'U';
  const initials = text
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Generate a consistent gradient background based on text char code sum
  const charSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-primary-500 to-primary-700',
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-600',
  ];
  const gradient = gradients[charSum % gradients.length];

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs font-semibold',
    md: 'w-9 h-9 text-sm font-semibold',
    lg: 'w-11 h-11 text-base font-semibold',
    xl: 'w-14 h-14 text-lg font-bold',
  };

  const ringSizes = {
    sm: 'ring-2 ring-offset-1',
    md: 'ring-2 ring-offset-2',
    lg: 'ring-2 ring-offset-2',
    xl: 'ring-2 ring-offset-2',
  };

  if (src) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-white shrink-0 border border-slate-200 ring ring-white ${ringSizes[size]} ${sizeClasses[size].replace(/w-\d+ h-\d+ /, '')} ${className}`}
        style={{ width: sizeClasses[size].match(/w-(\d+)/)?.[1], height: sizeClasses[size].match(/h-(\d+)/)?.[1] }}
      >
        <img
          src={src}
          alt={alt || initials}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br shadow-2xs border border-white/20 select-none shrink-0 ${gradient} text-white ${sizeClasses[size]} ${ringSizes[size]} ring-white ${className}`}
    >
      {initials}
    </div>
  );
}