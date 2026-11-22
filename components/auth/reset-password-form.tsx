'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/firebase/ClientApp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CarLoader } from '@/components/ui/loader';
import { Eye, EyeOff, Lock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { getAuthErrorMessage } from '@/lib/auth/auth-errors';

const inputClasses =
  'h-11 rounded-lg border-input bg-background/50 pl-10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-0';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const { toast } = useToast();

  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Valide le code dès l'arrivée : affiche l'e-mail concerné ou un état d'erreur clair
  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(setEmail)
      .catch(() => setEmail(null))
      .finally(() => setVerifying(false));
  }, [oobCode]);

  const passwordOk = password.length >= 8;
  const match = password === confirm;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !passwordOk || !match) return;
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
    } catch (err: any) {
      toast({
        title: 'Lien expiré',
        description: getAuthErrorMessage(err) || 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center py-16">
        <CarLoader size={130} />
        <p className="mt-4 text-sm text-muted-foreground">Vérification du lien…</p>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </span>
        <h1 className="mt-6 font-brand text-3xl font-bold">Mot de passe mis à jour</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Votre nouveau mot de passe est actif. Vous pouvez vous connecter dès maintenant.
        </p>
        <Button asChild className="mt-8 h-11 w-full rounded-lg font-semibold">
          <Link href="/login">
            Se connecter <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    );
  }

  if (!oobCode || !email) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Lock className="h-7 w-7 text-destructive" />
        </span>
        <h1 className="mt-6 font-brand text-3xl font-bold">Lien invalide ou expiré</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ce lien de réinitialisation n&apos;est plus valable — il a peut-être expiré ou déjà été utilisé.
          Retournez à la connexion et demandez un nouveau lien via « Mot de passe oublié ».
        </p>
        <Button asChild variant="outline" className="mt-8 h-11 w-full rounded-lg font-semibold">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </span>
      <h1 className="mt-6 font-brand text-3xl font-bold">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pour le compte <span className="font-semibold text-foreground">{email}</span>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-sm font-medium">Nouveau mot de passe</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              className={`${inputClasses} pr-11`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Retapez le mot de passe"
              autoComplete="new-password"
              className={inputClasses}
              required
            />
          </div>
        </div>

        {/* Règles visibles — pas de surprise à la soumission */}
        <ul className="space-y-1.5 text-xs">
          <li className={passwordOk ? 'text-emerald-600' : 'text-muted-foreground'}>
            {passwordOk ? '✓' : '•'} Au moins 8 caractères
          </li>
          <li className={confirm.length > 0 && match ? 'text-emerald-600' : 'text-muted-foreground'}>
            {confirm.length > 0 && match ? '✓' : '•'} Les deux mots de passe correspondent
          </li>
        </ul>

        <Button
          type="submit"
          disabled={!passwordOk || !match || loading}
          className="h-11 w-full rounded-lg font-semibold"
        >
          {loading ? 'Enregistrement…' : 'Enregistrer mon nouveau mot de passe'}
        </Button>
      </form>
    </motion.div>
  );
}
