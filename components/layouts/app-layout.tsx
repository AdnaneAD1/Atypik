'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { onMessage } from 'firebase/messaging';
import { messaging, db, generateToken } from '@/firebase/ClientApp';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AppLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AppLayout({ children, allowedRoles }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Handle scroll for header styling and check for device types
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close sidebar on mobile when resizing to mobile
      if (width < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
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
  // Déterminer si on affiche le prompt (sans demander automatiquement la permission)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const supported = 'serviceWorker' in navigator && 'Notification' in window;
      const dismissed = localStorage.getItem('notifPromptDismissed') === '1';
      const shouldShow = supported && !dismissed && Notification.permission === 'default';
      setShowNotifPrompt(shouldShow);
    } catch (e) {
      console.warn('Impossible de vérifier le support des notifications:', e);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // ...
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Génération et stockage du token FCM via generateToken() (uniquement si déjà autorisé)
  useEffect(() => {
    const setupFCMToken = async () => {
      if (typeof window === 'undefined') return;
      if (!user?.id) return;
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      try {
        const token = await generateToken();
        if (!token) return;

        await setDoc(
          doc(db, 'notificationSettings', user.id),
          {
            id: user.id,
            userId: user.id,
            fcmToken: token,
            isEnabled: true,
            permissions: {
              browser: true,
              transport: true,
              messages: true,
              general: true,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Erreur lors de la génération/enregistrement du token FCM:', err);
      }
    };

    setupFCMToken();
  }, [user?.id]);

  // Actions du prompt
  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined') return;
    if (!user?.id) return;
    setNotifLoading(true);
    try {
      const token = await generateToken();
      if (!token) {
        // Si l'utilisateur refuse ou si échec, on garde le prompt affiché
        return;
      }
      await setDoc(
        doc(db, 'notificationSettings', user.id),
        {
          id: user.id,
          userId: user.id,
          fcmToken: token,
          isEnabled: true,
          permissions: {
            browser: true,
            transport: true,
            messages: true,
            general: true,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setShowNotifPrompt(false);
      localStorage.setItem('notifPromptDismissed', '1');
    } catch (e) {
      console.error('Activation des notifications échouée:', e);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleDismissNotifPrompt = () => {
    setShowNotifPrompt(false);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('notifPromptDismissed', '1'); } catch {}
    }
  };

  if (!isMounted) {
    return null;
  }

  // Afficher la page "pending" pour les chauffeurs en attente de validation
  if (user?.role === 'driver' && user?.status === 'pending') {
    return <DriverPending />;
  }

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        {/* Desktop/Tablet Sidebar - Hidden on Mobile */}
        {!isMobile && (
          <aside className={`fixed left-0 top-0 z-30 h-full w-64 border-r bg-card transition-transform duration-300 ease-in-out ${
            isTablet && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'
          }`}>
            <div className="flex h-16 items-center justify-between border-b px-6">
              <Logo />
              {isTablet && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <SideNav />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${
          !isMobile && (!isTablet || isSidebarOpen) ? 'ml-64' : 'ml-0'
        }`}>
          {/* Header */}
          <header className={`sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200 ${
            isScrolled ? 'shadow-sm' : ''
          }`}>
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-2">
                {(isMobile || (isTablet && !isSidebarOpen)) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="h-9 w-9"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                {isMobile && (
                  <div className="flex items-center">
                    <Logo />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden lg:flex text-muted-foreground hover:text-foreground h-9 w-9"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:flex text-muted-foreground hover:text-foreground h-9 w-9"
                  onClick={() => router.push('/profile')}
                  aria-label="Ouvrir le profil"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <NotificationsPopover />
                <div className="hidden sm:block">
                  <ModeToggle />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-primary/10">
                        <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs sm:text-sm">
                          {user?.name?.charAt(0) || <UserRound className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 sm:w-56">
                    <DropdownMenuLabel className="text-sm">Mon compte</DropdownMenuLabel>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-sm"
                      onClick={() => router.push('/profile')}
                    >
                      <UserRound className="h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    {isMobile && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="flex items-center gap-2 text-sm"
                          onClick={() => router.push('/profile')}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Paramètres</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 text-sm">
                          <HelpCircle className="h-4 w-4" />
                          <span>Aide</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-sm text-destructive focus:text-destructive"
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
          <div className={`min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 ${
            isMobile ? 'pb-24' : 'pb-6'
          } transition-all duration-300`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-7xl mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile/Tablet Navigation - Side Sheet */}
        {(isMobile || isTablet) && (
          <>
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetContent side="left" className="p-0 w-72 sm:w-80">
                <SheetHeader className="flex h-16 items-center justify-between border-b px-6">
                  <SheetTitle className="text-left">
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <SideNav className="px-2" />
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Bottom Navigation for Mobile only */}
            {isMobile && <BottomNav />}
          </>
        )}
        
        {/* Overlay for tablet when sidebar is open */}
        {isTablet && isSidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Zone réservée pour une implémentation custom des notifications (init SW, prompts, etc.) */}
        {showNotifPrompt && (
          <div className="fixed bottom-4 right-4 z-50 w-[320px] max-w-[90vw] rounded-lg border bg-card shadow-lg">
            <div className="p-4 flex items-start gap-3">
              <div className="mt-0.5">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-semibold text-sm">Activer les notifications</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recevez des alertes en temps réel pour vos transports et messages importants.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleEnableNotifications} disabled={notifLoading} className="h-8 text-xs flex-1">
                    {notifLoading ? 'Activation…' : 'Activer'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDismissNotifPrompt} className="h-8 text-xs">
                    Plus tard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}