'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth/auth-context';
import { NativeShellProvider } from '@/components/mobile/native-shell-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <NativeShellProvider>
        <AuthProvider>{children}</AuthProvider>
      </NativeShellProvider>
    </ThemeProvider>
  );
}