import { forwardRef } from 'react';
import { cn } from '~/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-white/15 bg-slate-950/50 px-4 py-3 text-base text-white',
        'placeholder:text-slate-500',
        'outline-none transition',
        'focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
