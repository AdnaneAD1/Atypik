'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CarLoader, LoaderDots } from '@/components/ui/loader';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage } from '@/lib/auth/auth-errors';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type FormValues = z.infer<typeof formSchema>;

const inputClasses =
  'h-11 rounded-lg border-input bg-background/50 pl-10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-0';

export function LoginForm() {
  const { user, loading: isAuthLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login, loginWithGoogle, isLoading, error, clearError } = useFirebaseAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password);
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue sur Atypik Driver',
        variant: 'default',
      });
    } catch (error) {
      if (error) {
        toast({
          title: 'Erreur de connexion',
          description: getAuthErrorMessage(error),
          variant: 'destructive',
        });
      }
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues('email');
    if (!email) {
      toast({
        title: 'Email requis',
        description: 'Veuillez saisir votre email pour réinitialiser le mot de passe.',
        variant: 'destructive',
      });
      return;
    }
    // Validation simple côté client
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email invalide',
        description: 'Veuillez renseigner une adresse email valide.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setResetLoading(true);
      // Lien de réinitialisation custom : e-mail brandé Atypik + page dédiée /reset-password
      await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      toast({
        title: 'Email envoyé',
        description: 'Un lien de réinitialisation vous a été envoyé si le compte existe.',
        variant: 'default',
      });
    } catch (e: any) {
      // Ne pas divulguer si l'email existe ou non
      toast({
        title: 'Réinitialisation du mot de passe',
        description: 'Si un compte existe pour cet email, un lien a été envoyé.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    try {
      // Par défaut, on considère que c'est un parent qui se connecte
      await loginWithGoogle('parent');
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue sur Atypik Driver',
        variant: 'default',
      });
    } catch (error) {
      if (error) {
        toast({
          title: 'Erreur de connexion avec Google',
          description: getAuthErrorMessage(error),
          variant: 'destructive',
        });
      }
    }
  };

  // Si la session est en cours de vérification ou déjà active, éviter le flash du formulaire
  if (isAuthLoading || user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <CarLoader size={160} />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {user ? 'Redirection vers votre espace...' : 'Connexion à votre espace...'}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* En-tête */}
      <div className="space-y-1.5 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Bon retour</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous à votre espace Atypik
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Entrez votre email"
                      autoComplete="email"
                      {...field}
                      className={inputClasses}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Mail className="h-[18px] w-[18px]" />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                      className={`${inputClasses} pr-10`}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="h-[18px] w-[18px]" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between pt-1">
            <label htmlFor="remember" className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <span className="text-sm text-muted-foreground">
                Se souvenir de moi
              </span>
            </label>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-60"
              onClick={handleForgotPassword}
              disabled={isSubmitting || isLoading || resetLoading}
            >
              {resetLoading ? 'Envoi...' : 'Mot de passe oublié ?'}
            </Button>
          </div>

          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <LoaderDots className="mr-2" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-950 px-3 text-muted-foreground">
                  ou continuer avec
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || isLoading}
              onClick={handleGoogleLogin}
              className="w-full h-11 rounded-lg border-input font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continuer avec Google</span>
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Pas encore de compte ? <span className="text-primary">Créer un compte</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
