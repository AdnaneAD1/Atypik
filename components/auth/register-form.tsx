'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { BanAddressAutocomplete } from '@/components/ui/ban-address-autocomplete';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { UserRole } from '@/lib/auth/auth-context';
import { useRegion } from '@/hooks/use-region';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage } from '@/lib/auth/auth-errors';
import { ChevronLeft, Eye, EyeOff, CreditCard, ShieldCheck, Check } from 'lucide-react';

const inputClasses =
  'h-11 rounded-lg border-input bg-background/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-0';

const commonFieldsSchema = {
  firstName: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
};

const parentSchema = z.object({
  ...commonFieldsSchema,
  address: z.string().min(5, 'Adresse trop courte'),
  regionId: z.string().min(1, 'La région est obligatoire'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const driverSchema = z.object({
  ...commonFieldsSchema,
  licenseNumber: z.string().min(5, 'Numéro de permis trop court'),
  insuranceNumber: z.string().min(5, "Numéro d'assurance trop court"),
  address: z.string().min(5, 'Adresse trop courte'),
  regionId: z.string().min(1, 'La région est obligatoire'), // Champ requis
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ParentFormValues = z.infer<typeof parentSchema>;
type DriverFormValues = z.infer<typeof driverSchema>;

const roleOptions = [
  {
    id: 'parent' as const,
    label: 'Parent',
    description: 'Je fais transporter mes enfants',
    image: '/couple.png',
  },
  {
    id: 'driver' as const,
    label: 'Chauffeur',
    description: 'Je transporte des enfants',
    image: '/chauffeur.png',
  },
];

function GoogleIcon() {
  return (
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
  );
}

export function RegisterForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loginWithGoogle, isLoading, error, clearError } = useFirebaseAuth();
  const { toast } = useToast();
  const router = useRouter();

  const parentForm = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      regionId: '',
      password: '',
      confirmPassword: '',
    },
  });

  const driverForm = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      insuranceNumber: '',
      address: '',
      password: '',
      confirmPassword: '',
      regionId: '',
    },
  });

  const isParentSubmitting = parentForm.formState.isSubmitting;
  const isDriverSubmitting = driverForm.formState.isSubmitting;

  const onParentSubmit = async (data: ParentFormValues) => {
    try {
      await register(data, 'parent');
      toast({
        title: 'Inscription réussie',
        description: 'Votre compte parent a été créé avec succès',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Erreur d\'inscription',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const onDriverSubmit = async (data: DriverFormValues) => {
    try {
      if (!data.regionId) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner une région.',
          variant: 'destructive',
        });
        return;
      }
      await register(data, 'driver');
      toast({
        title: 'Inscription réussie',
        description: 'Votre candidature de chauffeur a été soumise',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Erreur d\'inscription',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const handleGoogleLogin = async (role: 'driver' | 'parent') => {
    clearError();
    try {
      await loginWithGoogle(role);
      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes connecté avec Google',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Erreur de connexion',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    }
  };

  const { regions } = useRegion();

  const renderPasswordToggle = (
    visible: boolean,
    toggle: () => void
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      onClick={toggle}
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      {/* En-tête */}
      <div className="space-y-1.5 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez votre profil pour commencer
        </p>
      </div>

      {/* Sélecteur de rôle — cartes illustrées */}
      <div className="grid grid-cols-2 gap-3 mb-8" role="radiogroup" aria-label="Type de compte">
        {roleOptions.map((option) => {
          const selected = selectedRole === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setSelectedRole(option.id)}
              className="relative flex flex-col items-center gap-2 rounded-xl border border-input bg-background p-5 text-center transition-colors hover:border-slate-300 dark:hover:border-slate-600"
            >
              {selected && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
              <Image
                src={option.image}
                alt=""
                width={52}
                height={52}
                className="h-[52px] w-[52px] object-contain"
              />
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-xs leading-snug text-muted-foreground">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedRole === 'parent' ? (
          <motion.div
            key="parent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Form {...parentForm}>
              <form onSubmit={parentForm.handleSubmit(onParentSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={parentForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Marie" autoComplete="given-name" {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parentForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" autoComplete="family-name" {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={parentForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="exemple@email.com" autoComplete="email" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={parentForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="06 12 34 56 78" autoComplete="tel" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={parentForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Adresse</FormLabel>
                      <FormControl>
                        <BanAddressAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="123 rue des Lilas, 75001 Paris"
                          className={inputClasses}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={parentForm.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Région</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Sélectionnez votre région" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map(region => (
                            <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={parentForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              {...field}
                              className={cn(inputClasses, 'pr-10')}
                            />
                            {renderPasswordToggle(showPassword, () => setShowPassword(!showPassword))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parentForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Confirmer</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              {...field}
                              className={cn(inputClasses, 'pr-10')}
                            />
                            {renderPasswordToggle(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isParentSubmitting || isLoading}
                  className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md mt-2"
                >
                  {isParentSubmitting || isLoading ? (
                    <Loader size="sm" className="mr-2" />
                  ) : null}
                  Créer mon compte
                </Button>

                <div className="relative py-2">
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
                  className="w-full h-11 rounded-lg border-input font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => handleGoogleLogin('parent')}
                  disabled={isLoading}
                >
                  <GoogleIcon />
                  Continuer avec Google
                </Button>
              </form>
            </Form>
          </motion.div>
        ) : (
          <motion.div
            key="driver"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Form {...driverForm}>
              <form onSubmit={driverForm.handleSubmit(onDriverSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={driverForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Thomas" autoComplete="given-name" {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={driverForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Martin" autoComplete="family-name" {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={driverForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="exemple@email.com" autoComplete="email" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={driverForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="06 12 34 56 78" autoComplete="tel" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={driverForm.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">N° de permis</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="123456789" {...field} className={cn(inputClasses, 'pl-10')} />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <CreditCard className="h-[18px] w-[18px]" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={driverForm.control}
                    name="insuranceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">N° d&apos;assurance</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="987654321" {...field} className={cn(inputClasses, 'pl-10')} />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <ShieldCheck className="h-[18px] w-[18px]" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={driverForm.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Région</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Sélectionnez une région" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map(region => (
                            <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={driverForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Adresse</FormLabel>
                      <FormControl>
                        <BanAddressAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="123 rue des Lilas, 75001 Paris"
                          className={inputClasses}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={driverForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              {...field}
                              className={cn(inputClasses, 'pr-10')}
                            />
                            {renderPasswordToggle(showPassword, () => setShowPassword(!showPassword))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={driverForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Confirmer</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              {...field}
                              className={cn(inputClasses, 'pr-10')}
                            />
                            {renderPasswordToggle(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isDriverSubmitting || isLoading}
                  className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md mt-2"
                >
                  {isDriverSubmitting || isLoading ? (
                    <Loader size="sm" className="mr-2" />
                  ) : null}
                  Soumettre ma candidature
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Déjà inscrit ? <span className="text-primary">Se connecter</span>
        </Link>
      </div>
    </motion.div>
  );
}
