'use client';

import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { AuthGuard } from '@/lib/auth/auth-guard';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-white dark:bg-slate-950">
        {/* Panneau visuel de marque — desktop uniquement */}
        <div className="hidden md:block md:w-1/2 lg:w-[52%] relative">
          <Image
            src="/auth-side.jpg"
            alt="Enfant sur le chemin de l'école"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay fonctionnel : garantit la lisibilité du bloc de marque */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-10 lg:p-14">
            <div className="font-brand font-bold text-4xl lg:text-5xl leading-none tracking-tight text-white">
              Atypik <span className="text-brand-yellow">Driver</span>
            </div>
            <p className="mt-3 text-lg font-medium text-white/85">
              pour des enfants exceptionnels
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Le transport adapté et sécurisé de vos enfants, entre des mains de confiance.
            </p>
          </div>
        </div>

        {/* Panneau formulaire */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full md:w-1/2 lg:w-[48%] min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-8 overflow-y-auto"
        >
          <div className="absolute top-5 right-5">
            <ModeToggle />
          </div>
          <div className="w-full max-w-md pt-8 pb-10 md:py-10">
            {/* Wordmark mobile : dans la colonne, aligné avec le contenu */}
            <div className="mb-10 md:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
