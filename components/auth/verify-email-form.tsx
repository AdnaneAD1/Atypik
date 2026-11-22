'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/firebase/ClientApp';
import { Button } from '@/components/ui/button';
import { CarLoader } from '@/components/ui/loader';
import { CheckCircle2, MailWarning } from 'lucide-react';

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!oobCode) {
      setState('error');
      return;
    }
    applyActionCode(auth, oobCode)
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [oobCode]);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center py-16">
        <CarLoader size={180} />
        <p className="mt-4 text-sm text-muted-foreground">Confirmation de votre adresse…</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </span>
        <h1 className="mt-6 font-brand text-3xl font-bold">Adresse confirmée</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Votre adresse e-mail est vérifiée et votre compte est actif.
          Bienvenue dans la communauté Atypik Driver.
        </p>
        <Button asChild className="mt-8 h-11 w-full rounded-lg font-semibold">
          <Link href="/login">Se connecter</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <MailWarning className="h-7 w-7 text-destructive" />
      </span>
      <h1 className="mt-6 font-brand text-3xl font-bold">Lien invalide</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Ce lien de confirmation n&apos;est plus valable - il a peut-être déjà été utilisé.
        Vous pouvez vous connecter et demander un nouvel envoi depuis votre espace.
      </p>
      <Button asChild variant="outline" className="mt-8 h-11 w-full rounded-lg font-semibold">
        <Link href="/login">Retour à la connexion</Link>
      </Button>
    </div>
  );
}
