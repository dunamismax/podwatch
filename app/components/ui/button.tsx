import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-cyan-300 text-zinc-950 hover:bg-cyan-200',
        outline: 'border border-zinc-700 bg-zinc-900/50 text-zinc-100 hover:bg-zinc-800',
        ghost: 'text-zinc-200 hover:bg-zinc-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, variant, size, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
