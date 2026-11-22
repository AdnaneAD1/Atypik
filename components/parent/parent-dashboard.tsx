'use client';

import { useState, useEffect } from 'react';
import {
  CalendarRange,
  Clock,
  Star,
  MessageSquare,
  Navigation,
  Route,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ParentCalendarView } from '@/components/parent/parent-calendar-view';
import { ParentChildListCard } from '@/components/parent/parent-child-list-card';
import { NextTransportCard } from '@/components/parent/next-transport-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CarLoader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';

import { useRegion } from '@/hooks/use-region';
import { useDashboard } from '@/hooks/use-dashboard';
import { useTracking } from '@/hooks/use-tracking';
import { cn } from '@/lib/utils';

export function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Hook pour les données du dashboard
  const {
    stats,
    upcomingTrips,
    weeklySchedule,
    children,
    reviews,
    notifications,
    loading,
    error,
    markNotificationAsRead,
    getNextTrip,
    getUnreadNotifications,
  } = useDashboard();

  // États pour les dialogues
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isThankDialogOpen, setIsThankDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{id: string; name: string} | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  // Gestionnaires d'événements
  const handleReply = (id: string, name: string) => {
    setSelectedReview({id, name});
    setIsReplyDialogOpen(true);
  };

  const handleThank = (id: string, name: string) => {
    setSelectedReview({id, name});
    setIsThankDialogOpen(true);
  };

  const handleSendReply = () => {
    toast({
      title: 'Réponse envoyée',
      description: `Votre réponse a été envoyée à ${selectedReview?.name}.`,
    });
    setIsReplyDialogOpen(false);
  };

  const handleSendThanks = () => {
    toast({
      title: 'Remerciement envoyé',
      description: `Votre message de remerciement a été envoyé à ${selectedReview?.name}.`,
    });
    setIsThankDialogOpen(false);
  };

  const handleViewChildProfile = () => {
    router.push('/parent/children/1');
  };

  const {
    regions,
    userRegion,
    loading: loadingRegions,
    dialogOpen,
    setRegionForUser
  } = useRegion();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const nextTrip = getNextTrip();
  // La carte latérale montre le PROCHAIN transport : si un trajet est en cours,
  // il est déjà affiché dans le bandeau en haut — on prend le suivant pour éviter le doublon
  const featuredTrip = nextTrip
    ? upcomingTrips.find(t => t.id !== nextTrip.id) ?? null
    : upcomingTrips[0] ?? null;
  const featuredTripChild = featuredTrip
    ? children.find(c => c.name === featuredTrip.childName) ?? null
    : null;

  // Position GPS live du chauffeur pour la barre de progression réelle
  const { listenMissionByTransport } = useTracking();
  const [livePosition, setLivePosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setLivePosition(null);
    if (!nextTrip?.id) return;
    const unsubscribe = listenMissionByTransport(nextTrip.id, (mission) => {
      if (mission?.currentPosition) {
        setLivePosition({
          lat: mission.currentPosition.lat,
          lng: mission.currentPosition.lng,
        });
      } else {
        setLivePosition(null);
      }
    });
    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextTrip?.id, listenMissionByTransport]);

  // Progression réelle du trajet : distance parcourue / distance totale (orthodromique)
  const tripProgress = (() => {
    if (!nextTrip) return 0;
    const R = 6371000;
    const rad = (d: number) => (d * Math.PI) / 180;
    const hav = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const dLat = rad(b.lat - a.lat);
      const dLng = rad(b.lng - a.lng);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const total = hav(nextTrip.from, nextTrip.to) || nextTrip.distance || 1;
    const done = livePosition ? hav(nextTrip.from, livePosition) : 0;
    // Le marqueur reste légèrement visible au départ et se fige à l'arrivée
    return Math.min(1, Math.max(livePosition ? 0.03 : 0, done / total));
  })();

  return (
    <>
      {/* Dialog de choix de région obligatoire */}
      <Dialog open={dialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Choisissez votre région
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Région</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedRegion || ''}
                onChange={e => setSelectedRegion(e.target.value)}
              >
                <option value="" disabled>Choisissez une région</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              disabled={!selectedRegion}
              onClick={() => selectedRegion && setRegionForUser(selectedRegion)}
              className="bg-primary hover:bg-primary/90"
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-8 md:px-6 lg:px-8"
        >
          {/* Header — style standard */}
          <div className="space-y-1">
            <motion.h1
              variants={itemVariants}
              className="text-2xl font-bold tracking-tight"
            >
              Bonjour, {user?.name?.split(' ')[0]}
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-sm text-muted-foreground"
            >
              Gérez le transport sécurisé de vos enfants en toute sérénité
            </motion.p>
          </div>

          {/* Trajet en cours — carte signature couleur de marque */}
          <motion.div variants={itemVariants}>
            <Card className={cn(
              'overflow-hidden rounded-2xl shadow-none',
              nextTrip ? 'border-primary/15 bg-primary/[0.06]' : 'border bg-card'
            )}>
              <CardContent className="p-5 sm:p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <CarLoader size={130} />
                  </div>
                ) : nextTrip ? (
                  <div className="space-y-5">
                    {/* Enfant + statut */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <Avatar className="h-14 w-14 shrink-0 border-2 border-white">
                          <AvatarImage
                            src={children.find(c => c.name === nextTrip.childName)?.avatar || ''}
                            alt={nextTrip.childName || 'Enfant'}
                          />
                          <AvatarFallback className="bg-white text-sm font-bold text-primary">
                            {(nextTrip.childName || 'EN')
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-primary">Transport en cours</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-brand text-2xl font-bold leading-none">
                              {nextTrip.childName}
                            </h3>
                            <Badge variant="outline" className="rounded-full border-primary/25 bg-white px-2.5 text-[11px] font-semibold text-primary">
                              {nextTrip.transportType === 'aller-retour' ? 'Aller-retour'
                                : nextTrip.transportType === 'aller' ? 'Aller' : 'Retour'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {/* Segments de statut — style image de référence */}
                      <div className="flex shrink-0 rounded-full border border-primary/20 bg-white p-0.5 text-[11px] font-semibold">
                        <span className={cn(
                          'rounded-full px-2.5 py-1',
                          nextTrip.status === 'programmed' ? 'bg-primary text-white' : 'text-muted-foreground'
                        )}>
                          En préparation
                        </span>
                        <span className={cn(
                          'rounded-full px-2.5 py-1',
                          nextTrip.status === 'in-progress' ? 'bg-primary text-white' : 'text-muted-foreground'
                        )}>
                          En route
                        </span>
                      </div>
                    </div>

                    {/* Ligne de progression — pilotée par la position GPS réelle du chauffeur */}
                    <div className="pt-9">
                      <div className="flex items-center">
                        <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white" />
                        <div className="relative h-4 flex-1">
                          <div className="absolute inset-x-0 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-primary/30" />
                          <div
                            className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-[width] duration-700"
                            style={{ width: `${tripProgress * 100}%` }}
                          />
                          <span
                            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-primary transition-[left] duration-700"
                            style={{ left: `${tripProgress * 100}%` }}
                          >
                            <span
                              className={cn(
                                'absolute bottom-[26px] whitespace-nowrap rounded-md bg-brand-teal px-3 py-1 font-brand text-sm font-bold text-white',
                                tripProgress < 0.15
                                  ? 'left-0'
                                  : tripProgress > 0.85
                                    ? 'right-0'
                                    : 'left-1/2 -translate-x-1/2'
                              )}
                            >
                              {(Math.max(0, 1 - tripProgress) * (nextTrip.distance || 0) / 1000).toFixed(1).replace('.', ',')} km restant
                            </span>
                            <span
                              className={cn(
                                'absolute bottom-[18px] border-[6px] border-transparent border-t-brand-teal',
                                tripProgress < 0.15
                                  ? 'left-0.5'
                                  : tripProgress > 0.85
                                    ? 'right-0.5'
                                    : 'left-1/2 -ml-1.5'
                              )}
                            />
                          </span>
                        </div>
                        <span className="h-3 w-3 shrink-0 rounded-full bg-primary" />
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{nextTrip.from.address}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Départ prévu à {nextTrip.scheduledTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="min-w-0 shrink-0 text-right">
                          <p className="truncate text-sm font-bold">{nextTrip.to.address}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {livePosition
                              ? `Reste ${(Math.max(0, 1 - tripProgress) * (nextTrip.distance || 0) / 1000).toFixed(1)} km`
                              : `Destination · ${((nextTrip.distance || 0) / 1000).toFixed(1)} km`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Chauffeur + actions */}
                    <div className="flex flex-col gap-3 border-t border-primary/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium">
                        Chauffeur : <span className="font-semibold">{nextTrip.driverName}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-primary/25 bg-white text-primary hover:bg-primary/5 hover:text-primary sm:flex-none"
                          onClick={() => router.push('/parent/messages')}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                        <Button
                          onClick={() => router.push('/parent/tracking')}
                          className="flex-1 bg-primary text-white hover:bg-primary/90 sm:flex-none"
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Suivre
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5 py-8 text-center sm:flex-row sm:text-left">
                    <div className="h-28 w-[102px] shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aucun trajet en cours</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Vous serez notifié dès qu&apos;un trajet démarre
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Grille principale */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Planning */}
            <motion.div variants={itemVariants} className="order-1 lg:col-span-2">
              <Card className="h-full rounded-xl border shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold">Planning de la semaine</CardTitle>
                      <p className="mt-0.5 text-sm text-muted-foreground">Vos transports programmés</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => router.push('/parent/calendar')}
                    >
                      Voir plus
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ParentCalendarView
                    weeklySchedule={weeklySchedule}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Prochain transport */}
            <motion.div variants={itemVariants} className="order-2 self-start lg:sticky lg:top-6">
              <NextTransportCard
                trip={featuredTrip}
                child={featuredTripChild}
                loading={loading}
              />
            </motion.div>
          </div>

          {/* Enfants + Évaluations côte à côte */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div variants={itemVariants}>
              <ParentChildListCard
                childrenData={children}
                loading={loading}
              />
            </motion.div>

            {/* Évaluations */}
            <motion.div variants={itemVariants}>
            <Card className="h-full rounded-xl border shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Évaluations</CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">Vos retours et avis</p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="received" className="w-full">
                  <TabsList className="mb-5 w-full justify-start gap-2 bg-transparent p-0">
                    <TabsTrigger
                      value="received"
                      className="min-h-[40px] rounded-full border border-slate-200 bg-transparent px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      Reçues
                    </TabsTrigger>
                    <TabsTrigger
                      value="given"
                      className="min-h-[40px] rounded-full border border-slate-200 bg-transparent px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      Données
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="received">
                    <div className="divide-y">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <CarLoader size={130} />
                        </div>
                      ) : reviews.filter(r => r.type === 'received' && r.rating).length > 0 ? (
                        reviews.filter(r => r.type === 'received' && r.rating).map((review) => (
                          <div key={review.id} className="py-4 first:pt-0">
                            <div className="flex items-start gap-3.5">
                              <Avatar className="h-11 w-11 shrink-0 border">
                                {review.reviewerAvatar && (
                                  <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                                )}
                                <AvatarFallback className="bg-brand-yellow text-xs font-bold text-slate-900">
                                  {review.reviewerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="font-semibold">{review.reviewerName}</h4>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <p className="text-xs text-muted-foreground">
                                        {review.date.toLocaleDateString('fr-FR')} · {review.reviewerRole === 'driver' ? 'Chauffeur' : 'Parent'}
                                      </p>
                                      <Badge variant="outline" className={cn(
                                        'h-5 px-2 py-0 text-[10px]',
                                        review.tripType === 'aller'
                                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                          : 'border-amber-200 bg-amber-50 text-amber-700'
                                      )}>
                                        {review.tripType === 'aller' ? 'Aller' : 'Retour'}
                                      </Badge>
                                      {review.childName && (
                                        <Badge variant="outline" className="h-5 px-2 py-0 text-[10px]">
                                          {review.childName}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {review.comment && (
                                  <p className="mt-2.5 border-l-2 border-slate-200 pl-3 text-sm italic leading-relaxed text-muted-foreground">
                                    &quot;{review.comment}&quot;
                                  </p>
                                )}

                                {review.canReply && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-10 border-brand-yellow/60 bg-brand-yellow/10 text-xs font-medium text-slate-900 hover:bg-brand-yellow/20 sm:h-9"
                                      onClick={() => handleThank(review.id, review.reviewerName)}
                                    >
                                      <Star className="mr-1.5 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                      Remercier
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-10 text-xs sm:h-9"
                                      onClick={() => handleReply(review.id, review.reviewerName)}
                                    >
                                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                                      Répondre
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10">
                          <p className="text-sm font-bold text-slate-900">Aucune évaluation reçue</p>
                          <p className="mt-1 text-sm text-muted-foreground">Les évaluations apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="given">
                    <div className="divide-y">
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <CarLoader size={130} />
                        </div>
                      ) : reviews.filter(r => r.type === 'given').length > 0 ? (
                        reviews.filter(r => r.type === 'given').map((review) => (
                          <div key={review.id} className="py-4 first:pt-0">
                            <div className="flex items-start gap-3.5">
                              <Avatar className="h-11 w-11 shrink-0 border">
                                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || 'Vous'} />}
                                <AvatarFallback className="bg-brand-teal text-xs font-bold text-white">
                                  {(user?.name || 'V').split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="font-semibold">Vous</h4>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <p className="text-xs text-muted-foreground">
                                        {review.date.toLocaleDateString('fr-FR')} · Parent
                                        {review.recipientName && (
                                          <span> · à {review.recipientName}</span>
                                        )}
                                      </p>
                                      <Badge variant="outline" className={cn(
                                        'h-5 px-2 py-0 text-[10px]',
                                        review.tripType === 'aller'
                                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                          : 'border-amber-200 bg-amber-50 text-amber-700'
                                      )}>
                                        {review.tripType === 'aller' ? 'Aller' : 'Retour'}
                                      </Badge>
                                      {review.childName && (
                                        <Badge variant="outline" className="h-5 px-2 py-0 text-[10px]">
                                          {review.childName}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {review.rating && (
                                    <div className="flex shrink-0 items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {review.comment && (
                                  <p className="mt-2.5 border-l-2 border-slate-200 pl-3 text-sm italic leading-relaxed text-muted-foreground">
                                    &quot;{review.comment}&quot;
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10">
                          <p className="text-sm font-bold text-slate-900">Aucune évaluation donnée</p>
                          <p className="mt-1 text-sm text-muted-foreground">Vos évaluations apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Dialogues */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Répondre à {selectedReview?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">
                Votre message
              </label>
              <textarea
                id="message"
                className="flex h-28 w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Merci pour votre évaluation..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={handleSendReply}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isThankDialogOpen} onOpenChange={setIsThankDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Remercier {selectedReview?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="thank-message" className="text-sm font-medium">
                Message de remerciement
              </label>
              <textarea
                id="thank-message"
                className="flex h-28 w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Merci beaucoup pour votre service exceptionnel..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsThankDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSendThanks}
              className="bg-primary hover:bg-primary/90"
            >
              <Star className="mr-1.5 h-4 w-4 fill-amber-400 text-amber-400" />
              Envoyer un remerciement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
