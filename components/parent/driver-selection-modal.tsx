'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Phone, Check, AlertTriangle, Award, Loader2 } from 'lucide-react';
import { useDriverSelection, Driver } from '@/hooks/use-driver-selection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

  const getDriverInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

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
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Choisir un chauffeur</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Sélectionnez un chauffeur de votre région pour programmer un transport
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
                    return (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => handleSelectDriver(driver)}
                        className={cn(
                          'relative rounded-xl border p-4 text-left transition-colors',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-slate-300 hover:bg-muted/30'
                        )}
                      >
                        {/* Coche de sélection */}
                        {selected && (
                          <span className="absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}

                        {/* Identité */}
                        <div className="flex items-center gap-3.5">
                          <Avatar className={cn('h-14 w-14 border-2 border-white', selected && 'ring-2 ring-primary/40')}>
                            <AvatarImage src={driver.avatar} alt={driver.name} />
                            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                              {getDriverInitials(driver.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold">{driver.name}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'h-5 px-2 py-0 text-[10px]',
                                  driver.status === 'verified'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-700'
                                )}
                              >
                                {driver.status === 'verified' ? 'Vérifié' : 'En attente'}
                              </Badge>
                              {driver.stats?.averageRating && driver.stats.averageRating > 4.5 && (
                                <Badge variant="outline" className="h-5 border-amber-200 bg-amber-50 px-2 py-0 text-[10px] text-amber-700">
                                  <Award className="mr-1 h-3 w-3" />
                                  Expert
                                </Badge>
                              )}
                            </div>
                            {(driver.stats?.averageRating ?? 0) > 0 && (
                              <div className="mt-1.5 flex items-center gap-1 text-xs">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-semibold">{driver.stats!.averageRating.toFixed(1)}</span>
                                <span className="text-muted-foreground">
                                  ({driver.stats!.totalReviews} avis)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Statistiques — bandeau plat */}
                        {driver.stats && (
                          <>
                            <div className="mt-3.5 grid grid-cols-4 divide-x rounded-lg border bg-muted/30">
                              {[
                                { value: driver.stats.totalMissions, label: 'Missions' },
                                { value: driver.stats.uniqueChildrenTransported, label: 'Enfants' },
                                { value: Math.round(driver.stats.totalKmTraveled), label: 'km' },
                                { value: driver.stats.thisMonthMissions, label: 'Ce mois' },
                              ].map((s) => (
                                <div key={s.label} className="py-2 text-center">
                                  <p className="text-sm font-bold leading-none">{s.value}</p>
                                  <p className="mt-1 text-[10px] leading-none text-muted-foreground">{s.label}</p>
                                </div>
                              ))}
                            </div>

                            {/* Indicateurs */}
                            <div className="mt-3 space-y-2.5">
                              <div>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Ponctualité</span>
                                  <span className="font-semibold">{Math.round(driver.stats.punctualityRate)}%</span>
                                </div>
                                <Progress value={driver.stats.punctualityRate} className="h-1.5" />
                              </div>
                              <div>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Fiabilité</span>
                                  <span className="font-semibold">{Math.round(driver.stats.reliabilityScore)}/100</span>
                                </div>
                                <Progress value={driver.stats.reliabilityScore} className="h-1.5" />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Contact */}
                        {driver.phone && (
                          <p className="mt-3.5 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
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
              <div className="flex items-center justify-between gap-3 border-t px-5 py-3.5">
                <p className="truncate text-sm text-muted-foreground">
                  {selectedDriver
                    ? <><span className="font-medium text-foreground">{selectedDriver.name}</span> sélectionné</>
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
