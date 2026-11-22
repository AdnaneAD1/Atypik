'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MessageCircle, ChevronLeft, ChevronRight, Route as RouteIcon, MoveRight } from 'lucide-react';
import { CarLoader } from '@/components/ui/loader';
import { useAuth } from '@/lib/auth/auth-context';
import { useDriversTransport } from '@/hooks/use-drivers-transport';
import { format, addDays, isToday, isSameDay, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function DriverCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const driverId = user?.id;
  const {
    transports,
    loading,
    error,
    getTransportsForDate
  } = useDriversTransport(driverId);

  // États pour le panneau latéral du jour et le modal de détail des missions
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);

  const missionsOfDay = (date ? getTransportsForDate(date) : [])
    .slice()
    .sort((a: any, b: any) => String(a.time || '').localeCompare(String(b.time || '')));

  // Gestionnaires pour le modal de détail
  const handleOpenMissionDetail = (mission: any) => {
    setSelectedMission(mission);
    setIsDetailDialogOpen(true);
  };

  const handleCloseMissionDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedMission(null);
  };

  // Fonction pour envoyer un message au parent
  const handleSendMessage = (mission: any) => {
    // Redirection vers la messagerie driver
    router.push('/driver/messages');
    toast({
      title: 'Messagerie',
      description: `Redirection vers la messagerie`,
    });
  };

  // Fonction pour démarrer la navigation
  const handleStartNavigation = (mission: any) => {
    const fromAddress = typeof mission.from === 'object' && mission.from && 'address' in mission.from
      ? mission.from.address
      : typeof mission.from === 'string' ? mission.from : '';
    const toAddress = typeof mission.to === 'object' && mission.to && 'address' in mission.to
      ? mission.to.address
      : typeof mission.to === 'string' ? mission.to : '';

    // Ouvrir Google Maps ou l'app de navigation par défaut
    const navigationUrl = `https://www.google.com/maps/dir/${encodeURIComponent(fromAddress)}/${encodeURIComponent(toAddress)}`;
    window.open(navigationUrl, '_blank');

    toast({
      title: 'Navigation démarrée',
      description: 'Ouverture de Google Maps pour la navigation',
    });
  };

  const addressOf = (point: any) =>
    typeof point === 'object' && point && 'address' in point ? point.address : typeof point === 'string' ? point : 'Adresse non définie';

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
      : 'bg-amber-50 text-amber-700 border-amber-200';

  const statusLabel = (status?: string) =>
    status === 'completed' ? 'Terminée' : status === 'cancelled' ? 'Annulée' : 'Programmée';

  const dayLabel = date ? format(date, 'EEEE d MMMM', { locale: fr }) : '';

  // Couleurs selon le type de transport — jaune + bleu-violet du logo Atypik
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

  // Accents : liseré + texte + fond à la couleur du type
  const typeAccent = (type?: string) =>
    type === 'aller-retour'
      ? { border: 'border-l-violet-500', text: 'text-violet-600', bg: 'bg-violet-500', soft: 'bg-violet-50', ring: 'border-violet-300' }
      : type === 'retour'
      ? { border: 'border-l-amber-400', text: 'text-amber-600', bg: 'bg-amber-400', soft: 'bg-amber-50', ring: 'border-amber-300' }
      : { border: 'border-l-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-500', soft: 'bg-indigo-50', ring: 'border-indigo-300' };

  const detailAccent = typeAccent(selectedMission?.transportType);

  // Vue semaine : 7 colonnes lun → dim à partir de la date sélectionnée
  const weekStart = startOfWeek(date ?? new Date(), { locale: fr });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${format(weekDays[0], 'd MMM', { locale: fr })} – ${format(weekDays[6], 'd MMM yyyy', { locale: fr })}`;

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

  // Pilule de mission — grille semaine et liste mobile
  const renderMissionChip = (m: any) => {
    const accent = typeAccent(m.transportType);
    return (
      <button
        key={m.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenMissionDetail(m);
        }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 text-left transition-shadow hover:shadow-sm',
          typeChipClass(m.transportType),
          m.status === 'cancelled' && 'opacity-60'
        )}
      >
        <Avatar className={cn('h-5 w-5 shrink-0 border-2 border-white ring-1', accent.ring.replace('border-', 'ring-'))}>
          <AvatarImage
            src={m.childAvatar || m.child?.avatar || ''}
            alt={m.childName || 'Enfant'}
          />
          <AvatarFallback className={cn('text-transparent', typeAvatarClass(m.transportType))}>
            <User className="h-2.5 w-2.5" />
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-none">
          {m.childName?.split(' ')[0]}
        </span>
        <span className={cn('shrink-0 text-[10px] font-bold leading-none', accent.text)}>
          {m.time}
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

  // Liste des missions d'un jour (réutilisée dans le panneau latéral)
  const renderDayMissions = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10">
          <CarLoader size={140} />
        </div>
      );
    }
    if (missionsOfDay.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="h-24 w-[88px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-horizontal.png"
              alt=""
              className="h-full w-full object-cover object-left"
            />
          </div>
          <p className="text-sm text-muted-foreground">Aucune mission prévue pour cette date</p>
        </div>
      );
    }
    return (
      <div className="divide-y">
        {missionsOfDay.map((mission: any) => {
          const accent = typeAccent(mission.transportType);
          return (
          <button
            key={mission.id}
            type="button"
            onClick={() => handleOpenMissionDetail(mission)}
            className={cn(
              'block w-full border-l-[3px] px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
              accent.border
            )}
          >
            {/* Horaire en gros — coloré selon le type */}
            <div className="flex items-center gap-2.5">
              <span className={cn('text-xl font-bold tracking-tight', accent.text)}>{mission.time || '—'}</span>
              <MoveRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">{typeLabel(mission.transportType)}</span>
              <Badge variant="outline" className={cn('ml-auto h-5 shrink-0 px-2 py-0 text-[10px]', statusBadge(mission.status))}>
                {statusLabel(mission.status)}
              </Badge>
            </div>

            {/* Itinéraire — points vert départ / corail arrivée */}
            <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate">{addressOf(mission.from)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="truncate">{addressOf(mission.to)}</span>
              </div>
            </div>

            {/* Personnes — style liste d'invités */}
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage
                    src={mission.childAvatar || mission.child?.avatar || ''}
                    alt={mission.childName || 'Enfant'}
                  />
                  <AvatarFallback className={cn('text-transparent', typeAvatarClass(mission.transportType))}>
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{mission.childName}</p>
                  {mission.transportType && (
                    <p className={cn('mt-0.5 text-[10px] font-medium uppercase tracking-wide',
                      mission.transportType === 'aller-retour' ? 'text-violet-600'
                        : mission.transportType === 'aller' ? 'text-indigo-600'
                        : 'text-amber-600'
                    )}>
                      {typeLabel(mission.transportType)}
                    </p>
                  )}
                </div>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">Enfant</span>
              </div>
              {mission.parentName && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-slate-100 text-transparent">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 truncate text-sm font-medium leading-tight">{mission.parentName}</p>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">Parent</span>
                </div>
              )}
            </div>
          </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre emploi du temps et vos missions
        </p>
      </div>

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

          {/* Grille semaine — style Gyaan */}
          <div>
            <div>
              {/* En-têtes des jours */}
              <div className="grid grid-cols-7 border-b">
                {weekDays.map((d) => (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => handleSelectDate(d)}
                    className={cn(
                      'flex flex-col items-center gap-1 border-l py-3 first:border-l-0 transition-colors hover:bg-accent/50',
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

              {/* Colonnes de missions — tablette/desktop uniquement */}
              <div className="hidden sm:grid sm:grid-cols-7">
                {weekDays.map((d) => {
                  const dayMissions = getTransportsForDate(d)
                    .slice()
                    .sort((a: any, b: any) => String(a.time || '').localeCompare(String(b.time || '')));
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
                      {dayMissions.length === 0
                        ? renderFreeDay()
                        : dayMissions.map((m: any) => renderMissionChip(m))}
                    </div>
                  );
                })}
              </div>

              {/* Mobile : missions du jour sélectionné en liste — pas de scroll horizontal */}
              <div className="border-t sm:hidden">
                {missionsOfDay.length === 0 ? (
                  renderFreeDay(true)
                ) : (
                  <div className="space-y-2 p-3">
                    {missionsOfDay.map((m: any) => renderMissionChip(m))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panneau latéral — missions du jour sélectionné */}
      <Sheet open={isDayPanelOpen} onOpenChange={setIsDayPanelOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          {/* Barre du haut — comme l'en-tête "Create event" */}
          <SheetHeader className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-2 pr-6">
              <SheetTitle className="text-left text-base font-semibold">Missions du jour</SheetTitle>
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
              {missionsOfDay.length} mission{missionsOfDay.length > 1 ? 's' : ''} planifiée{missionsOfDay.length > 1 ? 's' : ''}
              {date && isToday(date) && (
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                  Aujourd&apos;hui
                </Badge>
              )}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {renderDayMissions()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Détail mission — panneau latéral droit, style carte profil */}
      <Sheet open={isDetailDialogOpen} onOpenChange={handleCloseMissionDetail}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-md">
          {selectedMission && (
            <>
              {/* Profil centré — comme la carte de référence */}
              <div className="flex flex-col items-center px-5 pb-5 pt-10 text-center">
                <Avatar className={cn('h-20 w-20 border-4', detailAccent.border.replace('border-l-', 'border-'))}>
                  <AvatarImage
                    src={(selectedMission as any)?.childAvatar || (selectedMission as any)?.child?.avatar || ''}
                    alt={selectedMission.childName || 'Enfant'}
                  />
                  <AvatarFallback className={cn('text-lg font-semibold', typeAvatarClass(selectedMission.transportType))}>
                    {initials(selectedMission.childName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-3 text-lg font-bold tracking-tight">{selectedMission.childName}</h2>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {date && format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                  {selectedMission.transportType && (
                    <Badge variant="outline" className={cn('h-5 px-2 py-0 text-[10px]', typeBadge(selectedMission.transportType))}>
                      {typeLabel(selectedMission.transportType)}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn('h-5 px-2 py-0 text-[10px]', statusBadge(selectedMission.status))}>
                    {statusLabel(selectedMission.status)}
                  </Badge>
                </div>

                {/* Actions — bouton principal + action secondaire */}
                <div className="mt-4 flex w-full items-center gap-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleStartNavigation(selectedMission)}
                  >
                    <RouteIcon className="mr-1.5 h-4 w-4" />
                    Démarrer l&apos;itinéraire
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => handleSendMessage(selectedMission)}
                    aria-label="Envoyer un message"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Détails en liste à filets — style "Friends" */}
              <div className="divide-y border-t">
                {/* Heure */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Clock className={cn('h-4 w-4 shrink-0', detailAccent.text)} />
                  <p className="text-sm">
                    Prise en charge à <span className={cn('font-bold', detailAccent.text)}>{selectedMission.time || '—'}</span>
                    {typeof (selectedMission as any).waitingTime === 'number' && (
                      <span className="text-muted-foreground"> · {(selectedMission as any).waitingTime} min d&apos;attente</span>
                    )}
                  </p>
                </div>

                {/* Itinéraire */}
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
                        <p className="mt-0.5 break-words text-sm">{addressOf(selectedMission.from)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Arrivée</p>
                        <p className="mt-0.5 break-words text-sm">{addressOf(selectedMission.to)}</p>
                      </div>
                    </div>
                  </div>
                  {selectedMission.distance && (
                    <p className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                      <RouteIcon className="h-3.5 w-3.5" />
                      {(selectedMission.distance / 1000).toFixed(1)} km
                    </p>
                  )}
                </div>

                {/* Parent */}
                {selectedMission.parentName && (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="bg-slate-100 text-transparent">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{selectedMission.parentName}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">Parent</span>
                  </div>
                )}

                {/* Motif */}
                {selectedMission.motif && selectedMission.motif.trim() !== '' && (
                  <div className="flex items-start gap-3 px-5 py-3.5">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Motif</p>
                      <p className="break-words text-sm font-medium">{selectedMission.motif}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
