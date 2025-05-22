'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { UserRole, useAuth } from '@/lib/auth/auth-context';
import DriverPending from '@/components/driver/driver-pending';
import { 
  Bell, 
  LogOut,
  UserRound,
  Menu,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SideNav } from '@/components/navigation/side-nav';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { NotificationsPopover } from '@/components/notifications/notifications-popover';
import { motion, AnimatePresence } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AppLayout({ children, allowedRoles }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle scroll for header styling and check for mobile
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Initial checks
    handleResize();
    setIsMounted(true);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  // Afficher la page "pending" pour les chauffeurs en attente de validation
  if (user?.role === 'driver' && user?.status === 'pending') {
    return <DriverPending />;
  }

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="dashboard-layout">
        {/* Desktop Sidebar - Hidden on Mobile */}
        {!isMobile && (
          <aside className="dashboard-sidebar">
            <div className="p-6 border-b">
              <Logo />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <SideNav />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Header */}
          <header className="dashboard-header">
            <div className="h-16 px-6 flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className=""
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hidden lg:flex text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden lg:flex text-muted-foreground hover:text-foreground">
                  <Settings className="h-5 w-5" />
                </Button>
                <NotificationsPopover />
                <ModeToggle />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                        <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user?.name?.charAt(0) || <UserRound className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onClick={() => logout()}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className={`dashboard-content ${isMobile ? 'pb-20' : 'pb-4'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Navigation - Side Sheet */}
        {isMobile && (
          <>
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetContent side="left" className="p-0 w-72">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle>
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <SideNav className="px-2" />
              </SheetContent>
            </Sheet>
            
            {/* Bottom Navigation for Mobile */}
            <BottomNav />
          </>
        )}
      </div>
    </AuthGuard>
  );
}