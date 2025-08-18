'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CalendarRange, 
  LayoutDashboard, 
  MessageSquare,
  UserRound,
  MapPin,
  Car,
  FileText,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isParent = user.role === 'parent';
  
  const parentNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Accueil',
      href: '/parent/dashboard',
    },
    {
      icon: Users,
      label: 'Enfants',
      href: '/parent/children',
    },
    {
      icon: CalendarRange,
      label: 'Planning',
      href: '/parent/calendar',
    },
    {
      icon: MapPin,
      label: 'Suivi',
      href: '/parent/tracking',
    },
    {
      icon: FileText,
      label: 'Documents',
      href: '/parent/documents',
    },
  ];
  
  const driverNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Accueil',
      href: '/driver/dashboard',
    },
    {
      icon: Car,
      label: 'Missions',
      href: '/driver/missions',
    },
    {
      icon: CalendarRange,
      label: 'Planning',
      href: '/driver/calendar',
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      href: '/driver/messages',
    },
    {
      icon: UserRound,
      label: 'Profil',
      href: '/profile',
    },
  ];
  
  const navItems = isParent ? parentNavItems : driverNavItems;
  
  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t safe-bottom shadow-md">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5 mb-1" />
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-0 right-0 mx-auto w-5 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}