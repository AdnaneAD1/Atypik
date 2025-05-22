import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ size = 'md', className }: LoaderProps) {
  return (
    <div className="flex items-center justify-center">
      <div className={cn(
        'animate-spin rounded-full border-t-transparent',
        {
          'h-4 w-4 border-2': size === 'sm',
          'h-6 w-6 border-3': size === 'md',
          'h-8 w-8 border-4': size === 'lg',
        },
        'border-primary',
        className
      )} />
    </div>
  );
}