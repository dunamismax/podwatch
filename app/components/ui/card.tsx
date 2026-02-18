import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-zinc-900/65 p-6 shadow-2xl shadow-black/35 backdrop-blur',
        className,
      )}
      {...props}
    />
  );
}
