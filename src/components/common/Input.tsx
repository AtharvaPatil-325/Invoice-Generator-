import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-slate-700">
            {label}
            {props.required && <span className="text-danger-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-xl">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 ${
              icon ? 'pl-10' : ''
            } ${
              error
                ? 'border-danger-300 text-danger-900 focus:border-danger-500 focus:ring-danger-200'
                : 'border-slate-200 text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-primary-100'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-danger-600 animate-in fade-in duration-150">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';