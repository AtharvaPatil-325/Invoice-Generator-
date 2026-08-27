import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

const variants = {
  default: 'bg-white border border-slate-200/80 shadow-2xs',
  elevated: 'bg-white border border-slate-200/60 shadow-md',
  outlined: 'bg-white border border-slate-200 shadow-none',
  filled: 'bg-slate-50/80 border border-slate-200/60 shadow-none',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-8 sm:p-10',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`${variants[variant]} ${paddings[padding]} rounded-2xl transition-all duration-200 ${
        hover ? 'hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300/60' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-slate-100 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <h3 className={`text-base font-bold text-slate-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

type CardIconColor = 'primary' | 'success' | 'warning' | 'danger' | 'slate' | 'indigo' | 'teal' | 'purple' | 'orange' | 'rose';
type CardIconSize = 'sm' | 'md' | 'lg' | 'xl';

const colorMap: Record<CardIconColor, string> = {
  primary: 'bg-primary-50 text-primary-600 border-primary-100',
  success: 'bg-success-50 text-success-600 border-success-100',
  warning: 'bg-warning-50 text-warning-600 border-warning-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  teal: 'bg-teal-50 text-teal-600 border-teal-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
};

const sizeMap: Record<CardIconSize, string> = {
  sm: 'p-2 rounded-xl',
  md: 'p-2.5 rounded-xl',
  lg: 'p-3 rounded-2xl',
  xl: 'p-4 rounded-2xl',
};

interface CardIconProps extends HTMLAttributes<HTMLDivElement> {
  color?: CardIconColor;
  size?: CardIconSize;
  children: ReactNode;
}

export function CardIcon({
  children,
  color = 'primary',
  size = 'md',
  className = '',
  ...props
}: CardIconProps) {
  return (
    <div
      className={`inline-flex items-center justify-center border ${colorMap[color]} ${sizeMap[size]} shrink-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}