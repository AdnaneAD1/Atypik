'use client';

import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';
import { AuthGuard } from '@/lib/auth/auth-guard';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full h-screen flex">
          {/* Image côté gauche - visible uniquement sur desktop */}
          <div className="hidden md:block w-1/2 bg-primary/10 relative">
            <Image
              src="https://img.freepik.com/free-photo/close-up-boy-going-school_23-2150814387.jpg?uid=R143971211&ga=GA1.1.1911634789.1729294558&semt=ais_hybrid&w=740"
              alt="Atypik Driver"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
          </div>
          
          {/* Formulaire côté droit */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2 h-full flex flex-col justify-center items-center bg-white dark:bg-slate-900 relative overflow-auto"
          >
            {/* Logo et sélecteur de thème en position absolue en haut à droite */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
              <div className="group relative">
                <div className="p-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow transition-all duration-200 cursor-pointer">
                  <ModeToggle />
                </div>
                <span className="absolute right-0 top-full mt-1 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 text-xs px-2 py-1 rounded shadow-sm pointer-events-none">
                  Changer de thème
                </span>
              </div>
            </div>
            
            {/* Logo en haut à gauche */}
            <div className="absolute top-4 left-4 z-10">
              <div className="scale-90 origin-left">
                <Logo />
              </div>
            </div>
            
            <div className="w-full max-w-md px-8 pt-24 pb-8">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}