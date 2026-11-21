'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
      role="link"
      aria-label="Atypik Driver — accueil"
      className={cn('flex items-center cursor-pointer select-none', className)}
      onClick={handleClick}
    >
      <Image
        src="/logo-horizontal.png"
        alt="Atypik Driver — pour des enfants exceptionnels"
        width={1024}
        height={340}
        priority
        className={variant === 'minimal' ? 'h-10 w-auto' : 'h-14 w-auto'}
      />
    </div>
  );
}
