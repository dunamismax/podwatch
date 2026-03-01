import { cn } from '~/lib/utils';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border border-white/10 bg-[color:var(--pod-panel)] ring-1 ring-white/5 backdrop-blur',
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('space-y-6 p-6 sm:p-7', className)}>{children}</div>;
}
