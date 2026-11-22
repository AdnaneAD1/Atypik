'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Phone, AlertTriangle, Loader2, UserRound } from 'lucide-react';
import { useDriverSelection, Driver } from '@/hooks/use-driver-selection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DriverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverSelected: (driver: Driver) => void;
}

export const DriverSelectionModal = ({
  isOpen,
  onClose,
  onDriverSelected,
}: DriverSelectionModalProps) => {
  const { drivers, selectedDriver, selectDriver, loading, error } = useDriverSelection();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectDriver = async (driver: Driver) => {
    setIsSelecting(true);

    try {
      const success = await selectDriver(driver);
      if (success) {
        onDriverSelected(driver);
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du chauffeur:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-background shadow-xl"
          >
            {/* En-tête plat */}
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-brand text-2xl font-bold tracking-tight">Choisir un chauffeur</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sélectionnez un chauffeur de votre région pour programmer un transport.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 shrink-0"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Contenu */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {loading && (
                <div className="flex items-center justify-center gap-3 py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Chargement des chauffeurs...</span>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              )}

              {!loading && !error && drivers.length === 0 && (
                <div className="flex flex-col items-center gap-5 py-10 text-center sm:flex-row sm:text-left">
                  <div className="h-28 w-[102px] shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Aucun chauffeur disponible</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Aucun chauffeur n&apos;est actuellement disponible dans votre région.
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && drivers.length > 0 && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {drivers.map((driver) => {
                    const selected = selectedDriver?.id === driver.id;
                    const s = driver.stats;
                    // Un chauffeur sans mission ne doit pas afficher 0/0/0 —
                    // ça casse la confiance : on montre un message rassurant à la place
                    const hasExperience = (s?.totalMissions ?? 0) > 0;
                    const hasReviews = (s?.totalReviews ?? 0) > 0;
                    return (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => handleSelectDriver(driver)}
                        className={cn(
                          'relative flex h-full flex-col gap-4 rounded-[6px_28px_6px_28px] border p-5 text-left transition-colors',
                          selected
                            ? 'border-primary bg-white'
                            : 'border-border hover:border-slate-300 hover:bg-muted/30'
                        )}
                      >
                        {/* Identité : photo + nom + statut + avis */}
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 shrink-0 border-2 border-white">
                            <AvatarImage src={driver.avatar} alt={driver.name} />
                            <AvatarFallback className="bg-slate-100">
                              <UserRound className="h-7 w-7 text-slate-400" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-brand text-xl font-bold leading-tight">
                              {driver.name}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              {driver.status === 'verified' ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Vérifié
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  En attente
                                </span>
                              )}
                              {hasReviews ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold text-foreground">
                                    {s!.averageRating.toFixed(1).replace('.', ',')}
                                  </span>
                                  ({s!.totalReviews} avis)
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Pas encore d&apos;avis
                                </span>
                              )}
                            </div>
                          </div>

                          {selected && (
                            <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                              Sélectionné
                            </span>
                          )}
                        </div>

                        {/* Chiffres — seulement si le chauffeur a déjà roulé */}
                        {hasExperience ? (
                          <>
                            <dl className="grid grid-cols-4 divide-x border-y">
                              {[
                                { value: s!.totalMissions, label: s!.totalMissions > 1 ? 'Missions' : 'Mission' },
                                { value: s!.uniqueChildrenTransported, label: s!.uniqueChildrenTransported > 1 ? 'Enfants' : 'Enfant' },
                                { value: Math.round(s!.totalKmTraveled).toLocaleString('fr-FR'), label: 'km' },
                                { value: s!.thisMonthMissions, label: 'Ce mois' },
                              ].map((stat) => (
                                <div key={stat.label} className="flex flex-col-reverse items-center gap-1 py-3 text-center">
                                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                                  <dd className="font-brand text-2xl font-bold leading-none">{stat.value}</dd>
                                </div>
                              ))}
                            </dl>

                            {/* Jauges — affichées seulement quand la donnée existe */}
                            <div className="space-y-3">
                              {s!.punctualityRate > 0 && (
                                <div>
                                  <div className="mb-1.5 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Ponctualité</span>
                                    <span className="font-brand font-bold">{Math.round(s!.punctualityRate)} %</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-brand-teal"
                                      style={{ width: `${Math.min(100, s!.punctualityRate)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {s!.reliabilityScore > 0 && (
                                <div>
                                  <div className="mb-1.5 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Fiabilité</span>
                                    <span className="font-brand font-bold">{Math.round(s!.reliabilityScore)}/100</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-brand-teal"
                                      style={{ width: `${Math.min(100, s!.reliabilityScore)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="border-y py-3 text-sm text-muted-foreground">
                            Nouveau chauffeur Atypik — profil vérifié par nos équipes.
                          </p>
                        )}

                        {/* Contact */}
                        {driver.phone && (
                          <p className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {driver.phone}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pied */}
            {!loading && !error && drivers.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t px-5 py-3.5 sm:px-6">
                <p className="truncate text-sm text-muted-foreground">
                  {selectedDriver
                    ? <><span className="font-brand font-bold text-foreground">{selectedDriver.name}</span> sélectionné</>
                    : 'Sélectionnez un chauffeur pour continuer'
                  }
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    disabled={!selectedDriver || isSelecting}
                    onClick={() => selectedDriver && handleSelectDriver(selectedDriver)}
                  >
                    {isSelecting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Sélection...
                      </>
                    ) : (
                      'Confirmer'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
