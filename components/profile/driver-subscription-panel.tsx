'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BadgeCheck, CarFront, Crown, UserRound } from 'lucide-react';
import { CarLoader, LoaderDots } from '@/components/ui/loader';
import { useAuth } from '@/lib/auth/auth-context';
import { useDriverSelection } from '@/hooks/use-driver-selection';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';
import { DriverProfileDialog } from '@/components/parent/driver-profile-dialog';
import { SubscriptionModal } from '@/components/parent/subscription-modal';

const formatDate = (ts?: { toDate?: () => Date }) => {
  const d = ts?.toDate?.();
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
};

export function DriverSubscriptionPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedDriver, loading: driversLoading } = useDriverSelection();
  const {
    subscription,
    hasActiveSubscription,
    cancelSubscription,
    loadSubscription,
    weeklyTransportCount,
    loading: subscriptionLoading,
  } = useSubscription();

  const [driverProfileOpen, setDriverProfileOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (user?.role !== 'parent') return null;

  const stats = selectedDriver?.stats;
  const rating = stats?.averageRating ?? 0;
  const reviewsCount = stats?.totalReviews ?? 0;
  const hasReviews = reviewsCount > 0;
  const renewDate = formatDate(subscription?.nextBillingDate) ?? formatDate(subscription?.endDate);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await cancelSubscription();
      setCancelDialogOpen(false);
      toast({
        title: 'Abonnement arrêté',
        description: 'Votre abonnement reste actif jusqu’à sa date de fin.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d’arrêter l’abonnement pour le moment.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section aria-label="Chauffeur et abonnement">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Votre chauffeur */}
        <Card className="flex flex-col rounded-[6px_28px_6px_28px] border shadow-none">
          <CardContent className="flex flex-1 flex-col gap-5 p-6">
            <h2 className="flex items-center gap-2 font-brand text-lg font-bold">
              <CarFront className="h-5 w-5 text-primary" />
              Votre chauffeur
            </h2>

            {driversLoading ? (
              <div className="flex flex-1 items-center justify-center py-6">
                <CarLoader size={130} />
              </div>
            ) : selectedDriver ? (
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 shrink-0">
                  <AvatarImage src={selectedDriver.avatar} alt={selectedDriver.name} />
                  <AvatarFallback className="bg-brand-pink/10">
                    <UserRound className="h-8 w-8 text-brand-pink" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate font-brand text-xl font-bold leading-tight">
                    {selectedDriver.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {selectedDriver.status === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <BadgeCheck className="h-4 w-4" />
                        Vérifié
                      </span>
                    )}
                    {hasReviews && (
                      <span className="flex items-center gap-2">
                        <span className="flex gap-0.5" aria-hidden="true">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`h-2 w-3.5 rounded-sm ${i < Math.round(rating) ? 'bg-amber-400' : 'bg-amber-200/60'}`}
                            />
                          ))}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rating.toFixed(1).replace('.', ',')} ({reviewsCount} avis)
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-pink/10">
                  <UserRound className="h-8 w-8 text-brand-pink" />
                </span>
                <div>
                  <h3 className="font-brand text-xl font-bold leading-tight">Attribution en cours</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nos équipes vous assigneront un chauffeur de notre réseau.
                  </p>
                </div>
              </div>
            )}

            {selectedDriver && (
              <Button
                variant="outline"
                className="mt-auto h-11 self-start border-slate-900 text-slate-900 hover:bg-slate-100"
                onClick={() => setDriverProfileOpen(true)}
              >
                Voir
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Mon abonnement — fond beurre comme la maquette */}
        <Card className="flex flex-col rounded-[6px_28px_6px_28px] border-0 bg-brand-yellow/25 shadow-none">
          <CardContent className="flex flex-1 flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 font-brand text-lg font-bold">
                <Crown className="h-5 w-5 text-primary" />
                Mon abonnement
              </h2>
              {hasActiveSubscription && subscription && (
                <span className="rounded-full bg-primary px-3.5 py-1 text-sm font-bold capitalize text-white">
                  {subscription.type}
                </span>
              )}
            </div>

            {subscriptionLoading ? (
              <div className="flex flex-1 items-center justify-center py-6">
                <CarLoader size={130} />
              </div>
            ) : hasActiveSubscription && subscription ? (
              <>
                <p className="font-brand text-3xl font-bold leading-tight">
                  {subscription.type === 'premium' ? 'Transports illimités' : '2 transports par semaine'}
                </p>
                <p className="text-sm text-amber-950/75">
                  {subscription.type === 'standard' && `${weeklyTransportCount}/2 utilisés cette semaine · `}
                  {subscription.autoRenew && renewDate
                    ? `Renouvellement automatique le ${renewDate}`
                    : renewDate
                      ? `Actif jusqu’au ${renewDate}`
                      : 'Abonnement actif'}
                  {subscription.price ? ` — ${subscription.price} €` : ''}
                </p>
                <div className="mt-auto flex items-center gap-5">
                  <Button
                    variant="outline"
                    className="h-11 border-primary text-primary hover:bg-primary/5"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Arrêter l’abonnement
                  </Button>
                  {subscription.type === 'standard' && (
                    <button
                      type="button"
                      className="text-sm font-bold text-primary underline decoration-2 underline-offset-4 hover:text-primary/80"
                      onClick={() => setSubscriptionModalOpen(true)}
                    >
                      Passer en Premium
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="font-brand text-3xl font-bold leading-tight">Aucune formule active</p>
                <p className="text-sm text-muted-foreground">
                  Choisissez une formule pour programmer des transports.
                </p>
                <Button
                  className="mt-auto h-11 self-start bg-primary text-white hover:bg-primary/90"
                  onClick={() => setSubscriptionModalOpen(true)}
                >
                  Choisir une formule
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <DriverProfileDialog
        driver={selectedDriver}
        open={driverProfileOpen}
        onOpenChange={setDriverProfileOpen}
      />
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        onSubscriptionCreated={() => {
          loadSubscription();
          setSubscriptionModalOpen(false);
        }}
      />

      {/* Confirmation d'arrêt */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Arrêter l’abonnement ?</DialogTitle>
            <DialogDescription>
              Votre formule restera active jusqu’à sa date de fin. Vous ne serez plus débité ensuite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}>
              Conserver
            </Button>
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <LoaderDots className="mr-2" />
                  Arrêt en cours...
                </>
              ) : (
                'Confirmer l’arrêt'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
