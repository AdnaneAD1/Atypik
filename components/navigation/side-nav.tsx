'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  CalendarRange, 
  Home, 
  MessageSquare,
  UserRound,
  MapPin,
  Car,
  GraduationCap,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  HelpCircle,
  BarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';

interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isParent = user.role === 'parent';
  
  const parentNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      href: '/parent/dashboard',
    },
    {
      icon: Users,
      label: 'Mes enfants',
      href: '/parent/children',
    },
    {
      icon: CalendarRange,
      label: 'Planning',
      href: '/parent/calendar',
    },
    {
      icon: MapPin,
      label: 'Suivi en temps réel',
      href: '/parent/tracking',
    },
    {
      icon: FileText,
      label: 'Documents',
      href: '/parent/documents',
    },
    {
      icon: MessageSquare,
      label: 'Messagerie',
      href: '/parent/messages',
    },
  ];
  
  const driverNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      href: '/driver/dashboard',
    },
    {
      icon: Car,
      label: 'Missions du jour',
      href: '/driver/missions',
    },
    {
      icon: CalendarRange,
      label: 'Planning',
      href: '/driver/calendar',
    },
    {
      icon: BarChart,
      label: 'Statistiques',
      href: '/driver/stats',
    },
    {
      icon: GraduationCap,
      label: 'Formations',
      href: '/driver/formations',
    },
    {
      icon: MessageSquare,
      label: 'Messagerie',
      href: '/driver/messages',
    },
  ];

  const bottomNavItems = [
    {
      icon: Settings,
      label: 'Paramètres',
      href: `/${user.role}/settings`,
    },
    {
      icon: HelpCircle,
      label: 'Aide',
      href: `/${user.role}/help`,
    },
  ];
  
  const navItems = isParent ? parentNavItems : driverNavItems;
  
  return (
    <aside className={cn("h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm flex flex-col", className)}>
      {/* En-tête du menu */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <UserRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{user.name || 'Utilisateur'}</p>
            <p className="text-xs text-muted-foreground">{isParent ? 'Espace Parent' : 'Espace Chauffeur'}</p>
          </div>
        </div>
      </div>
      
      {/* Menu principal */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-x-3 font-medium rounded-xl h-11 mb-1 transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 dark:bg-primary/20 text-primary" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                )}
                onClick={() => router.push(item.href)}
              >
                <div className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-lg",
                  isActive ? "bg-primary/20 dark:bg-primary/30" : "bg-slate-100 dark:bg-slate-800"
                )}>
                  <item.icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                  )} />
                </div>
                <span>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Menu du bas */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-x-3 font-medium text-sm rounded-lg",
                  isActive 
                    ? "bg-primary/10 dark:bg-primary/20 text-primary" 
                    : "hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400"
                )}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}