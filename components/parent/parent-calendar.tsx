'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { TransportEventDialog } from './transport-event-dialog';
import { SubscriptionModal } from './subscription-modal';
import { DriverSubscriptionPanel } from '@/components/profile/driver-subscription-panel';

import { useToast } from '@/hooks/use-toast';
import { useTransport, TransportEvent } from '@/hooks/use-transport';
import { useChildren } from '@/hooks/use-children';
import { useSubscription } from '@/hooks/use-subscription';
import { useDriverSelection } from '@/hooks/use-driver-selection';
import { useAuth } from '@/lib/auth/auth-context';
import { format, addDays, isToday, isSameDay, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarPlus, Clock, MessageCircle, X, Star,
  ChevronLeft, ChevronRight, MoveRight, Route as RouteIcon
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CarLoader, LoaderDots } from '@/components/ui/loader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ParentCalendar() {
  // Fonction utilitaire pour vérifier si une date est passée sans modifier l'objet Date original
  const isDatePast = useCallback((dateToCheck: Date | undefined): boolean => {
    if (!dateToCheck) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCompare = new Date(dateToCheck);
    dateToCompare.setHours(0, 0, 0, 0);
    return dateToCompare < today;
  }, []);

  const { toast } = useToast();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedTransportDate, setSelectedTransportDate] = useState<Date | undefined>(new Date());

  // États pour le panneau du jour et le détail transport
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<TransportEvent | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // États pour le modal d'abonnement
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Utiliser le hook useTransport
  const {
    transportEvents,
    loading,
    error,
    addTransport,
    updateTransport,
    addTransportComment,
    getTransportsForDate,
    hasTransportsOnDate
  } = useTransport();

  // Utiliser le hook useSubscription
  const {
    subscription,
    hasActiveSubscription,
    canCreateTransportForDate,
    getWeeklyTransportCountForDate,
    loadSubscription
  } = useSubscription();

  // Utiliser les hooks d'authentification et de sélection de chauffeur
  const { user } = useAuth();
  const { selectedDriver, hasSelectedDriver } = useDriverSelection();

  // Enfants du parent — pour afficher leur vraie photo dans le planning
  const { children } = useChildren();

  const childAvatarFor = useCallback((t: TransportEvent): string | null => {
    return (
      children.find(c => c.id === t.childId)?.avatar ??
      children.find(c => c.name === t.childName)?.avatar ??
      null
    );
  }, [children]);

  // Fonction pour ajouter un nouvel événement de transport
  const handleAddEvent = async (data: any) => {
    const targetDate = data?.date instanceof Date ? data.date : new Date();
    const countForTargetWeek = getWeeklyTransportCountForDate(targetDate);

    // Vérifier l'abonnement pour la semaine de la date programmée avant de créer le transport
    if (!canCreateTransportForDate(targetDate)) {
      // Déterminer le message d'erreur selon la situation
      let message = 'Vous devez souscrire à un abonnement pour programmer un transport.';

      if (hasActiveSubscription && subscription?.type === 'standard' && countForTargetWeek >= 2) {
        message = `Limite atteinte : votre abonnement Standard permet jusqu'à 2 transports par semaine. Vous avez déjà programmé ${countForTargetWeek} transport(s) sur cette semaine. Passez à l'abonnement Premium pour des transports illimités.`;
      } else if (!hasActiveSubscription) {
        message = 'Vous devez souscrire à un abonnement pour programmer un transport.';
      }

      toast({
        title: 'Abonnement requis',
        description: message,
        variant: 'destructive',
      });
      setIsSubscriptionModalOpen(true);
      return {
        success: false,
        message,
      };
    }

    // Vérifier qu'un chauffeur a été assigné par les équipes
    if (!hasSelectedDriver || !selectedDriver) {
      toast({
        title: "Chauffeur en cours d'attribution",
        description: "Nos équipes vous assigneront un chauffeur de notre réseau très prochainement.",
      });
      return {
        success: false,
        message: 'Aucun chauffeur assigné pour le moment.',
      };
    }

    const result = await addTransport({
      childId: data.childId,
      childName: data.childName,
      date: data.date,
      time: data.time,
      transportType: data.transportType,
      from: data.from,
      to: data.to,
      distance: data.distance,
      driverId: selectedDriver.id,
      status: 'programmed',
      motif: data.motif,
      waitingTime: data.waitingTime,
    });

    if (result) {
      return {
        success: true,
        message: `Transport ${data.transportType} ajouté pour ${data.childName} le ${format(data.date, 'dd/MM/yyyy')} à ${data.time}`,
      };
    } else {
      return {
        success: false,
        message: `Le transport n'a pas pu être ajouté (aucun chauffeur disponible ou erreur).`,
      };
    }
  };

  // Fonction pour ouvrir le détail d'un transport
  const handleOpenTransportDetail = (transport: TransportEvent) => {
    setSelectedTransport(transport);
    setComment('');
    setRating(0);
    setIsDetailDialogOpen(true);
  };

  // Fonction pour fermer le panneau de détail
  const handleCloseTransportDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedTransport(null);
    setComment('');
    setRating(0);
    setIsSubmittingComment(false);
    setIsCancelling(false);
  };

  // Gestionnaires pour le modal d'abonnement
  const handleCloseSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
  };

  const handleSubscriptionCreated = async () => {
    // Recharger les données d'abonnement
    await loadSubscription();
    toast({
      title: 'Abonnement activé !',
      description: 'Vous pouvez maintenant programmer vos transports.',
    });
  };

  // Fonction pour ouvrir le dialog de transport (avec vérification du chauffeur assigné)
  const handleOpenTransportDialog = () => {
    if (!hasSelectedDriver || !selectedDriver) {
      toast({
        title: "Chauffeur en cours d'attribution",
        description: "Nos équipes vous assigneront un chauffeur de notre réseau très prochainement.",
      });
      return;
    }

    // Si un chauffeur est assigné, ouvrir directement le dialog de transport
    setIsEventDialogOpen(true);
  };

  // Fonction pour déterminer si un transport peut être annulé
  const canCancelTransport = (transport: TransportEvent) => {
    if (!transport.date) return false;
    const transportDate = transport.date instanceof Date ? transport.date : (transport.date as any).toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(transportDate);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate >= today && transport.status !== 'completed' && transport.status !== 'cancelled';
  };

  // Fonction pour déterminer si un transport peut recevoir un commentaire
  const canCommentTransport = (transport: TransportEvent) => {
    if (!transport.date || transport.status === 'cancelled') return false;
    const transportDate = transport.date instanceof Date ? transport.date : (transport.date as any).toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(transportDate);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today || transport.status === 'completed';
  };

  // Fonction pour annuler un transport
  const handleCancelTransport = async () => {
    if (!selectedTransport) return;

    setIsCancelling(true);
    try {
      const success = await updateTransport(selectedTransport.id, {
        ...selectedTransport,
        status: 'cancelled'
      });

      if (success) {
        handleCloseTransportDetail();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler le transport.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Fonction pour soumettre une évaluation avec commentaire
  const handleSubmitComment = async () => {
    if (!selectedTransport || !comment.trim() || rating === 0) return;

    setIsSubmittingComment(true);
    try {
      const success = await addTransportComment(selectedTransport.id, rating, comment.trim());

      if (success) {
        handleCloseTransportDetail();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'évaluation.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // ---------- Helpers visuels — palette Atypik (comme le planning chauffeur) ----------

  const initials = (name?: string) =>
    name ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'EN';

  const typeBadge = (type?: string) =>
    type === 'aller-retour'
      ? 'bg-violet-50 text-violet-700 border-violet-200'
      : type === 'aller'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : 'bg-amber-50 text-amber-700 border-amber-300';

  const typeLabel = (type?: string) =>
    type === 'aller-retour' ? 'Aller-Retour' : type === 'aller' ? 'Aller' : 'Retour';

  const statusBadge = (status?: string) =>
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'cancelled'
      ? 'bg-red-50 text-red-600 border-red-200'
      : status === 'in-progress' || status === 'in_progress' || status === 'started'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  const statusLabel = (status?: string) =>
    status === 'completed' ? 'Terminé' :
    status === 'cancelled' ? 'Annulé' :
    status === 'in-progress' || status === 'in_progress' || status === 'started' ? 'En cours' :
    'Programmé';

  const typeChipClass = (type?: string) =>
    type === 'aller-retour'
      ? 'border-violet-300 bg-violet-50'
      : type === 'aller'
      ? 'border-indigo-200 bg-indigo-50'
      : type === 'retour'
      ? 'border-amber-300 bg-amber-50'
      : 'border-indigo-200 bg-indigo-50/60';

  const typeAvatarClass = (type?: string) =>
    type === 'aller-retour'
      ? 'bg-violet-100 text-violet-600'
      : type === 'aller'
      ? 'bg-indigo-100 text-indigo-600'
      : 'bg-amber-100 text-amber-700';

  const typeAccent = (type?: string) =>
    type === 'aller-retour'
      ? { border: 'border-l-violet-500', text: 'text-violet-600', ring: 'border-violet-300' }
      : type === 'retour'
      ? { border: 'border-l-amber-400', text: 'text-amber-600', ring: 'border-amber-300' }
      : { border: 'border-l-indigo-500', text: 'text-indigo-600', ring: 'border-indigo-300' };

  const detailAccent = typeAccent(selectedTransport?.transportType);

  // Vue semaine : 7 colonnes lun → dim à partir de la date sélectionnée
  const weekStart = startOfWeek(date ?? new Date(), { locale: fr });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${format(weekDays[0], 'd MMM', { locale: fr })} – ${format(weekDays[6], 'd MMM yyyy', { locale: fr })}`;

  const transportsOfDay = (date ? getTransportsForDate(date) : [])
    .slice()
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));

  const dayLabel = date ? format(date, 'EEEE d MMMM', { locale: fr }) : '';

  const handleSelectDate = (day?: Date) => {
    if (!day) return;
    setDate(day);
    // Panneau latéral uniquement sur tablette/desktop ; sur mobile la journée
    // s'affiche directement sous les en-têtes
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches) {
      setIsDayPanelOpen(true);
    }
  };

  const goToWeek = (offset: number) => {
    setDate((current) => addDays(current ?? new Date(), offset));
  };

  // Pilule de transport — grille semaine et liste mobile
  const renderTransportChip = (t: TransportEvent) => {
    const accent = typeAccent(t.transportType);
    return (
      <button
        key={t.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenTransportDetail(t);
        }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 text-left transition-shadow hover:shadow-sm',
          typeChipClass(t.transportType),
          t.status === 'cancelled' && 'opacity-60'
        )}
      >
        <Avatar className={cn('h-5 w-5 shrink-0 border-2 border-white ring-1', accent.ring.replace('border-', 'ring-'))}>
          <AvatarImage src={childAvatarFor(t) ?? undefined} alt={t.childName} />
          <AvatarFallback className={cn('text-[8px] font-bold', typeAvatarClass(t.transportType))}>
            {initials(t.childName)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-none">
          {t.childName?.split(' ')[0]}
        </span>
        <span className={cn('shrink-0 text-[10px] font-bold leading-none', accent.text)}>
          {t.time}
        </span>
      </button>
    );
  };

  // Voiture du logo — remplissage des colonnes/jours vides
  const renderFreeDay = (compact?: boolean) => (
    <div className={cn('flex flex-1 flex-col items-center justify-center gap-1.5 opacity-50', compact ? 'py-8' : 'h-full')}>
      <div className="h-11 w-10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">Libre</span>
    </div>
  );

  // Liste des transports d'un jour (panneau latéral)
  const renderDayTransports = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10">
          <CarLoader size={140} />
        </div>
      );
    }
    if (transportsOfDay.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="h-24 w-[88px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
          </div>
          <div>
            <p className="text-sm font-medium">Aucun transport prévu</p>
            <p className="mt-1 text-xs text-muted-foreground">Programmez un trajet pour cette date</p>
          </div>
          {!isDatePast(date) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTransportDate(date);
                handleOpenTransportDialog();
              }}
            >
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              Programmer
            </Button>
          )}
        </div>
      );
    }
    return (
      <div className="divide-y">
        {transportsOfDay.map((transport) => {
          const accent = typeAccent(transport.transportType);
          return (
            <button
              key={transport.id}
              type="button"
              onClick={() => handleOpenTransportDetail(transport)}
              className={cn(
                'block w-full border-l-[3px] px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                accent.border
              )}
            >
              {/* Horaire en gros — coloré selon le type */}
              <div className="flex items-center gap-2.5">
                <span className={cn('text-xl font-bold tracking-tight', accent.text)}>{transport.time || '—'}</span>
                <MoveRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{typeLabel(transport.transportType)}</span>
                <Badge variant="outline" className={cn('ml-auto h-5 shrink-0 px-2 py-0 text-[10px]', statusBadge(transport.status))}>
                  {statusLabel(transport.status)}
                </Badge>
              </div>

              {/* Itinéraire — points vert départ / corail arrivée */}
              <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="truncate">{transport.from?.address || 'Départ'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="truncate">{transport.to?.address || 'Arrivée'}</span>
                </div>
              </div>

              {/* Enfant — style liste d'invités */}
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={childAvatarFor(transport) ?? undefined} alt={transport.childName} />
                  <AvatarFallback className={cn('text-[10px] font-bold', typeAvatarClass(transport.transportType))}>
                    {initials(transport.childName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{transport.childName}</p>
                  <p className={cn('mt-0.5 text-[10px] font-medium uppercase tracking-wide', accent.text)}>
                    {typeLabel(transport.transportType)}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">Enfant</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 sm:px-4 md:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez et gérez le planning de transport
          </p>
        </div>

        <Button
          className="h-10 w-full bg-primary hover:bg-primary/90 sm:w-auto"
          onClick={() => {
            setSelectedTransportDate(date);
            handleOpenTransportDialog();
          }}
          disabled={isDatePast(date)}
        >
          <CalendarPlus className="mr-1.5 h-4 w-4" />
          Programmer un transport
        </Button>
      </div>

      {/* Section chauffeur & abonnement — panneau partagé avec le profil */}
      {user?.role === 'parent' && <DriverSubscriptionPanel />}

      {/* Grille semaine — style Gyaan, comme le planning chauffeur */}
      <Card className="overflow-hidden rounded-xl border shadow-none">
        <CardContent className="p-0">
          {/* Barre d'outils : période + navigation semaine + aujourd'hui */}
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 gap-1.5 px-2.5 text-sm font-semibold capitalize">
                  {weekLabel}
                  <ChevronRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                />
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToWeek(-7)}
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToWeek(7)}
                aria-label="Semaine suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="ml-1 h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setDate(new Date())}
              >
                Aujourd&apos;hui
              </Button>
            </div>
          </div>

          <div>
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((d) => (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => handleSelectDate(d)}
                  className={cn(
                    'flex flex-col items-center gap-1 border-l py-3 transition-colors first:border-l-0 hover:bg-accent/50',
                    date && isSameDay(d, date) && 'bg-indigo-50/60'
                  )}
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {format(d, 'EEE', { locale: fr })}
                  </span>
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      isToday(d) && 'bg-primary font-semibold text-primary-foreground',
                      date && isSameDay(d, date) && !isToday(d) && 'bg-amber-100 font-semibold text-amber-800'
                    )}
                  >
                    {format(d, 'd')}
                  </span>
                </button>
              ))}
            </div>

            {/* Colonnes de transports — tablette/desktop uniquement */}
            <div className="hidden sm:grid sm:grid-cols-7">
              {weekDays.map((d) => {
                const dayTransports = getTransportsForDate(d)
                  .slice()
                  .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
                const selected = date ? isSameDay(d, date) : false;
                return (
                  <div
                    key={d.toISOString()}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectDate(d)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectDate(d)}
                    className={cn(
                      'flex min-h-[300px] cursor-pointer flex-col gap-2 border-l p-2 transition-colors first:border-l-0 hover:bg-accent/30',
                      selected && 'bg-indigo-50/40'
                    )}
                  >
                    {dayTransports.length === 0
                      ? renderFreeDay()
                      : dayTransports.map((t) => renderTransportChip(t))}
                  </div>
                );
              })}
            </div>

            {/* Mobile : transports du jour sélectionné en liste — pas de scroll horizontal */}
            <div className="border-t sm:hidden">
              {transportsOfDay.length === 0 ? (
                renderFreeDay(true)
              ) : (
                <div className="space-y-2 p-3">
                  {transportsOfDay.map((t) => renderTransportChip(t))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour programmer un transport */}
      <TransportEventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        selectedDate={selectedTransportDate || new Date()}
        onAddEvent={handleAddEvent}
        key={selectedTransportDate?.toISOString()} // Forcer la réinitialisation du composant quand la date change
      />

      {/* Panneau latéral — transports du jour sélectionné */}
      <Sheet open={isDayPanelOpen} onOpenChange={setIsDayPanelOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-2 pr-6">
              <SheetTitle className="text-left text-base font-semibold">Transports du jour</SheetTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => date && setDate(addDays(date, -1))}
                  aria-label="Jour précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => date && setDate(addDays(date, 1))}
                  aria-label="Jour suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Date en gros — style typographique */}
          <div className="border-b px-5 py-4">
            <p className="text-lg font-bold capitalize tracking-tight">{dayLabel}</p>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              {transportsOfDay.length} transport{transportsOfDay.length > 1 ? 's' : ''} planifié{transportsOfDay.length > 1 ? 's' : ''}
              {date && isToday(date) && (
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                  Aujourd&apos;hui
                </Badge>
              )}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {renderDayTransports()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Détail transport — panneau latéral droit, style carte profil */}
      <Sheet open={isDetailDialogOpen} onOpenChange={handleCloseTransportDetail}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-md">
          {selectedTransport && (
            <>
              {/* Profil centré */}
              <div className="flex flex-col items-center px-5 pb-5 pt-10 text-center">
                <Avatar className={cn('h-20 w-20 border-4 border-white ring-2', detailAccent.ring.replace('border-', 'ring-'))}>
                  <AvatarImage src={childAvatarFor(selectedTransport) ?? undefined} alt={selectedTransport.childName} />
                  <AvatarFallback className={cn('text-lg font-bold', typeAvatarClass(selectedTransport.transportType))}>
                    {initials(selectedTransport.childName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-3 text-lg font-bold tracking-tight">{selectedTransport.childName}</h2>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {format(
                    selectedTransport.date instanceof Date
                      ? selectedTransport.date
                      : (selectedTransport.date as any).toDate(),
                    'EEEE d MMMM yyyy',
                    { locale: fr }
                  )}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                  <Badge variant="outline" className={cn('h-5 px-2 py-0 text-[10px]', typeBadge(selectedTransport.transportType))}>
                    {typeLabel(selectedTransport.transportType)}
                  </Badge>
                  <Badge variant="outline" className={cn('h-5 px-2 py-0 text-[10px]', statusBadge(selectedTransport.status))}>
                    {statusLabel(selectedTransport.status)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="mt-4 flex w-full items-center gap-2">
                  {canCancelTransport(selectedTransport) ? (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleCancelTransport}
                      disabled={isSubmittingComment || isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <LoaderDots className="mr-1.5" />
                          Annulation...
                        </>
                      ) : (
                        'Annuler le transport'
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => router.push('/parent/tracking')}
                    >
                      <RouteIcon className="mr-1.5 h-4 w-4" />
                      Suivre le trajet
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => router.push('/parent/messages')}
                    aria-label="Envoyer un message"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Détails en liste à filets */}
              <div className="divide-y border-t">
                {/* Heure */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Clock className={cn('h-4 w-4 shrink-0', detailAccent.text)} />
                  <p className="text-sm">
                    Prise en charge à <span className={cn('font-bold', detailAccent.text)}>{selectedTransport.time || '—'}</span>
                    {typeof selectedTransport.waitingTime === 'number' && (
                      <span className="text-muted-foreground"> · {selectedTransport.waitingTime} min d&apos;attente</span>
                    )}
                  </p>
                </div>

                {/* Itinéraire — tirets pointillés */}
                {selectedTransport.from && selectedTransport.to && (
                  <div className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="my-1 h-8 w-0 border-l-2 border-dashed border-slate-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-3.5">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Départ</p>
                          <p className="mt-0.5 break-words text-sm">{selectedTransport.from.address}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Arrivée</p>
                          <p className="mt-0.5 break-words text-sm">{selectedTransport.to.address}</p>
                        </div>
                      </div>
                    </div>
                    {selectedTransport.distance > 0 && (
                      <p className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                        <RouteIcon className="h-3.5 w-3.5" />
                        {(selectedTransport.distance / 1000).toFixed(1)} km
                      </p>
                    )}
                  </div>
                )}

                {/* Chauffeur */}
                {selectedDriver && (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={selectedDriver.avatar} alt={selectedDriver.name} />
                      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                        {initials(selectedDriver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{selectedDriver.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">Chauffeur</span>
                  </div>
                )}

                {/* Motif */}
                {selectedTransport.motif && selectedTransport.motif.trim() !== '' && (
                  <div className="flex items-start gap-3 px-5 py-3.5">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Motif</p>
                      <p className="break-words text-sm font-medium">{selectedTransport.motif}</p>
                    </div>
                  </div>
                )}

                {/* Évaluation — transports passés/terminés */}
                {canCommentTransport(selectedTransport) && (
                  <div className="space-y-3 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      <p className="text-sm font-medium">Évaluer ce transport</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={cn(
                              'h-6 w-6 transition-colors',
                              star <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground hover:text-amber-300'
                            )}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {rating} étoile{rating > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <Textarea
                      placeholder="Partagez votre expérience avec ce transport..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />

                    {comment.trim() && rating > 0 && (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={handleSubmitComment}
                        disabled={isSubmittingComment || isCancelling}
                      >
                        {isSubmittingComment ? (
                          <>
                            <LoaderDots className="mr-2" />
                            Envoi...
                          </>
                        ) : (
                          'Envoyer l\'évaluation'
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal d'abonnement */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={handleCloseSubscriptionModal}
        onSubscriptionCreated={handleSubscriptionCreated}
      />

    </div>
  );
}
