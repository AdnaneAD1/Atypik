'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { UserRole } from '@/lib/auth/auth-context';
import { useRegion } from '@/hooks/use-region';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, UserRound, Car } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';


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

export function RegisterForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
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
        description: 'Une erreur est survenue lors de l\'inscription',
        variant: 'destructive',
      });
    }
  };

  const onDriverSubmit = async (data: DriverFormValues) => {
    try {
      if (regionStatus === 'verified') {
        toast({
          title: 'Erreur',
          description: 'Impossible de postuler sur une région déjà attribuée à un chauffeur validé.',
          variant: 'destructive',
        });
        return;
      }
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
        description: 'Une erreur est survenue lors de l\'inscription',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleLogin = async (role: UserRole) => {
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
        description: 'Une erreur est survenue lors de la connexion avec Google',
        variant: 'destructive',
      });
    }
  };

  const { regions } = useRegion();
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [validatedDriver, setValidatedDriver] = useState<any | null>(null);
  const [regionStatus, setRegionStatus] = useState<'free' | 'verified' | 'pending' | null>(null);

  useEffect(() => {
    if (!selectedRegionId) {
      setValidatedDriver(null);
      setRegionStatus(null);
      return;
    }

    const fetchValidatedDriver = async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'driver'),
        where('regionId', '==', selectedRegionId),
        where('status', '==', 'validated')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setValidatedDriver(snapshot.docs[0].data());
        setRegionStatus('verified');
      } else {
        const pendingQ = query(
          collection(db, 'users'),
          where('role', '==', 'driver'),
          where('regionId', '==', selectedRegionId),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQ);
        if (!pendingSnapshot.empty) {
          setValidatedDriver(null);
          setRegionStatus('pending');
        } else {
          setValidatedDriver(null);
          setRegionStatus('free');
        }
      }
    };

    fetchValidatedDriver();
  }, [selectedRegionId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md w-full mx-auto space-y-6 p-4 sm:p-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Inscription</h1>
        <p className="text-muted-foreground text-sm">
          Créez votre compte pour accéder à l'application
        </p>
      </div>

      <Tabs defaultValue="parent" className="w-full" onValueChange={(value) => setSelectedRole(value as UserRole)}>
        <TabsList className="grid grid-cols-2 w-full h-14">
          <TabsTrigger value="parent" className="data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            <span>Parent</span>
          </TabsTrigger>
          <TabsTrigger value="driver" className="data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span>Chauffeur</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent key="parent" value="parent" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
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
                            <Input placeholder="Marie" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                            <Input placeholder="Dupont" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                          <Input placeholder="exemple@email.com" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                          <Input placeholder="06 12 34 56 78" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={parentForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium">Adresse</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="123 rue des Lilas, 75001 Paris" {...field} className="h-12 pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            </div>
                          </div>
                        </FormControl>
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
                            <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                            <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isParentSubmitting || isLoading}
                    className="w-full h-11 text-base mt-2 bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    {isParentSubmitting || isLoading ? (
                      <Loader size="sm" className="mr-2" />
                    ) : null}
                    Créer mon compte
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou continuer avec
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-base font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                    onClick={() => handleGoogleLogin('parent')}
                    disabled={isLoading}
                  >
                    <svg
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="google"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 488 512"
                    >
                      <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                      ></path>
                    </svg>
                    Continuer avec Google
                  </Button>
                </form>
              </Form>
            </motion.div>
          </TabsContent>

          <TabsContent key="driver" value="driver" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
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
                            <Input placeholder="Thomas" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                            <Input placeholder="Martin" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                          <Input placeholder="exemple@email.com" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                          <Input placeholder="06 12 34 56 78" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">N° de permis</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="123456789" {...field} className="h-12 pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M7 12h10" /><path d="M7 16h10" /><path d="M7 8h10" /></svg>
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">N° d'assurance</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="987654321" {...field} className="h-12 pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
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
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium">Région</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="h-12 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary"
                            value={selectedRegionId}
                            onChange={e => {
                              setSelectedRegionId(e.target.value);
                              field.onChange(e);
                            }}
                          >
                            <option value="">Sélectionnez une région</option>
                            {regions.map(region => (
                              <option key={region.id} value={region.id}>{region.name}</option>
                            ))}
                          </select>
                        </FormControl>
                        {regionStatus === 'verified' && (
                          <div className="text-red-500 text-xs mt-1">
                            Cette région a déjà un chauffeur validé ({validatedDriver?.displayName ?? 'Chauffeur'}). Veuillez en choisir une autre.
                          </div>
                        )}
                        {regionStatus === 'pending' && (
                          <div className="text-yellow-600 text-xs mt-1">
                            Un chauffeur est déjà en attente de validation sur cette région. Vous pouvez tout de même postuler.
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={driverForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-medium">Adresse</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="123 rue des Lilas, 75001 Paris" {...field} className="h-12 pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            </div>
                          </div>
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
                            <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
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
                            <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isDriverSubmitting || isLoading}
                    className="w-full h-11 text-base mt-2 bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    {isDriverSubmitting || isLoading ? (
                      <Loader size="sm" className="mr-2" />
                    ) : null}
                    Soumettre ma candidature
                  </Button>
                </form>
              </Form>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center transition-colors">
            <ChevronLeft className="h-3 w-3 mr-1" />
            Se connecter
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
