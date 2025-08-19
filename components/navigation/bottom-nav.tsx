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
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isParent = user.role === 'parent';
  const isDriver = user.role === 'driver';
  const isAdmin = user.role === 'admin';
  
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
  
  const adminNavItems = [
    {
          icon: LayoutDashboard,
          label: 'Dashboard',
          href: '/admin/dashboard',
        },
        {
          icon: Users,
          label: 'Parents',
          href: '/admin/parents',
        },
        {
          icon: Users,
          label: 'Chauffeurs',
          href: '/admin/drivers',
        },
        {
          icon: ShieldCheck,
          label: 'Assignations',
          href: '/admin/assignments',
        },
        {
          icon: UserRound,
          label: 'Administrateurs',
          href: '/admin/admins',
        },
    // Optionally add messages or profile later if needed
  ];

  const navItems = isParent
    ? parentNavItems
    : isDriver
    ? driverNavItems
    : isAdmin
    ? adminNavItems
    : [];
  
  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const gridColsClass = navItems.length === 5
    ? 'grid-cols-5'
    : navItems.length === 4
    ? 'grid-cols-4'
    : navItems.length === 3
    ? 'grid-cols-3'
    : 'grid-cols-5';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t safe-bottom shadow-md">
      <div className={cn('grid h-16', gridColsClass)}>
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