'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  CalendarRange, 
  MessageSquare,
  UserRound,
  MapPin,
  CarFront,
  GraduationCap,
  LayoutDashboard,
  Users,
  FileText,
  HelpCircle,
  BarChart,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
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
  ];
  
  const driverNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      href: '/driver/dashboard',
    },
    {
      icon: CarFront,
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
      icon: UserRound,
      label: 'Profil',
      href: '/profile',
    },
  ];
  
  const navItems = isAdmin ? adminNavItems : isParent ? parentNavItems : driverNavItems;
  
  return (
    <aside className={cn("h-full bg-card border-r flex flex-col", className)}>
      {/* En-tête du menu */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user.avatar || ''} alt={user.name || 'Utilisateur'} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {(user.name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name || 'Utilisateur'}</p>
            <p className="text-xs text-muted-foreground">{isAdmin ? 'Espace Admin' : isParent ? 'Espace Parent' : 'Espace Chauffeur'}</p>
            {isDriver && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                En service
              </p>
            )}
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
                  "w-full justify-start gap-x-3 font-medium rounded-full h-11 mb-1 px-4 transition-colors",
                  isActive
                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-foreground dark:text-slate-300 dark:hover:bg-slate-800/80"
                )}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="h-4 w-4" />
                <span>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Menu du bas */}
      <div className="p-3 border-t bg-slate-50/60 dark:bg-slate-800/40">
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-x-3 font-medium text-sm rounded-full px-4 transition-colors",
                  isActive
                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-700/80"
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