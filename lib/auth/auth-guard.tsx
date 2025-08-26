'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from './auth-context';
import { Loader } from '@/components/ui/loader';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Attendez que le chargement initial soit terminé avant de faire des redirections
    if (!loading) {
      // Si nous sommes sur la page d'accueil, laissons la redirection de la page s'occuper de cela
      if (pathname === '/') {
        return;
      }
      
      // Si non authentifié et pas sur les pages d'authentification, rediriger vers login
      if (!isAuthenticated && !pathname.includes('/login') && !pathname.includes('/register')) {
        router.push('/login');
        return;
      }
      
      // Si authentifié mais sur une page d'authentification, rediriger vers le tableau de bord approprié
      if (isAuthenticated && (pathname.includes('/login') || pathname.includes('/register'))) {
        const dashboardPath = user?.role === 'parent' 
          ? '/parent/dashboard' 
          : user?.role === 'driver' 
          ? '/driver/dashboard' 
          : '/admin/dashboard';
        router.push(dashboardPath);
        return;
      }
      
      // Si authentifié mais non autorisé pour cette page spécifique au rôle
      if (
        isAuthenticated &&
        allowedRoles &&
        user?.role &&
        !allowedRoles.includes(user.role)
      ) {
        const dashboardPath = user?.role === 'parent' 
          ? '/parent/dashboard' 
          : user?.role === 'driver' 
          ? '/driver/dashboard' 
          : '/admin/dashboard';
        router.push(dashboardPath);
        return;
      }
    }
  }, [loading, isAuthenticated, pathname, user, router, allowedRoles]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  // Auth pages should be accessible when not authenticated
  if (!isAuthenticated && (pathname.includes('/login') || pathname.includes('/register'))) {
    return <>{children}</>;
  }

  // Protected pages should check for authentication and authorization
  if (isAuthenticated) {
    if (!allowedRoles || (user?.role && allowedRoles.includes(user.role))) {
      return <>{children}</>;
    }
    return null; // Don't render anything while redirecting
  }

  return null; // Don't render anything while redirecting
}