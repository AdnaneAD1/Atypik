'use client';

import { useRouter } from 'next/navigation';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'default' | 'minimal';
  className?: string;
  onClick?: () => void;
}

export function Logo({ variant = 'default', className, onClick }: LogoProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/');
    }
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-3 cursor-pointer', 
        className
      )}
      onClick={handleClick}
    >
      <div className="relative flex items-center justify-center h-10 w-10 bg-primary rounded-xl overflow-hidden">
        <span className="text-white font-bold text-2xl">A</span>
      </div>
      {variant === 'default' && (
        <span className="text-2xl font-bold text-primary">
          Atypik Driver
        </span>
      )}
    </div>
  );
}