'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

export function NativeShellProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // 1. Masquer le splash screen natif dès le premier montage côté client
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
  }, []);

  // 2. Synchroniser la barre d'état (StatusBar) native avec le thème clair / sombre
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const syncStatusBar = async () => {
      try {
        const isDark = resolvedTheme === 'dark';
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });
        await StatusBar.setBackgroundColor({
          color: isDark ? '#0f172a' : '#ffffff',
        });
      } catch (err) {
        // Ignoré sur plateformes non compatibles
      }
    };

    syncStatusBar();
  }, [resolvedTheme]);

  // 3. Gestionnaire universel du bouton Retour physique et gestuel d'Android
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // A. Vérifier si une modale ou un dialogue Radix/Sheet est ouvert
      const openDialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (openDialog) {
        // Simuler la touche Échap pour refermer proprement la modale
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
        document.dispatchEvent(escEvent);
        return;
      }

      // B. Si on est sur une page racine / accueil, minimiser l'app sans la crasher
      const rootRoutes = [
        '/',
        '/login',
        '/register',
        '/parent/dashboard',
        '/driver/dashboard',
        '/admin/dashboard',
      ];

      if (rootRoutes.includes(pathname)) {
        CapApp.minimizeApp();
        return;
      }

      // C. Sinon, naviguer en arrière dans l'historique
      if (canGoBack) {
        router.back();
      } else {
        CapApp.minimizeApp();
      }
    });

    return () => {
      backListener.then((l) => l.remove()).catch(() => {});
    };
  }, [pathname, router]);

  // 4. Gestion intelligente du clavier virtuel sur mobile
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const showListener = Keyboard.addListener('keyboardWillShow', () => {
      // Ajuster le scroll sur l'élément actif si nécessaire
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    });

    return () => {
      showListener.then((l) => l.remove()).catch(() => {});
    };
  }, []);

  return <>{children}</>;
}
