'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Search, Clock, User, AlertTriangle, X,
  Play, CheckCircle2, Check, MoreVertical, Route as RouteIcon, MessageCircle, SlidersHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useAuth } from '@/lib/auth/auth-context';
import { useMissions } from '@/hooks/use-missions';
import { useTracking } from '@/hooks/use-tracking';
import { RouteModal } from './route-modal';
import { cn } from '@/lib/utils';

export function DriverMissions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const { user } = useAuth();
  const router = useRouter();
  const driverId = user?.id;
  const { missions, loading, error, refresh } = useMissions(driverId || '');
  const { startMission, completeMission, activeMissions, loading: trackingLoading, getActiveMissionByTransport } = useTracking();

  // Dialog state
  const [openNeeds, setOpenNeeds] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);

  const handleShowNeeds = (mission: any) => {
    setSelectedMission(mission);
    setOpenNeeds(true);
  };

  // Terminer une mission de transport
  const handleCompleteMission = async (mission: any) => {
    try {
      const active = getActiveMissionByTransport(mission.id);
      if (active?.id) {
        const ok = await completeMission(active.id);
        if (ok) {
          refresh();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la fin de la mission:', error);
    }
  };

  const handleShowDetails = (mission: any) => {
    setSelectedMission(mission);
    setOpenDetails(true);
  };

  const handleShowItinerary = (mission: any) => {
    setSelectedMission(mission);
    setShowRouteModal(true);
  };

  const handleCloseDialogs = () => {
    setOpenNeeds(false);
    setOpenDetails(false);
    setSelectedMission(null);
  };

  const handleCloseRouteModal = () => {
    setShowRouteModal(false);
    setSelectedMission(null);
  };

  // Commencer une mission de transport
  const handleStartMission = async (mission: any) => {
    try {
      const missionData = {
        driverId: driverId!,
        transportId: mission.id,
        childName: mission.child.name,
        from: {
          address: mission.from.address,
          lat: mission.from.lat || 0,
          lng: mission.from.lng || 0,
        },
        to: {
          address: mission.to.address,
          lat: mission.to.lat || 0,
          lng: mission.to.lng || 0,
        },
      };

      const result = await startMission(mission.id, missionData);
      if (result) {
        // Rafraîchir la liste des missions
        refresh();
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la mission:', error);
    }
  };

  // Vérifier si une mission est déjà active
  const isMissionActive = (missionId: string) => {
    return activeMissions.some(active => active.transportId === missionId);
  };

  // Affichage si non connecté
  if (!driverId) {
    return <div className="p-8 text-center text-red-500">Veuillez vous connecter en tant que chauffeur.</div>;
  }

  // Affichage du chargement
  if (loading) {
    return <div className="p-8 text-center">Chargement des missions...</div>;
  }

  // Affichage de l'erreur
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  // Palette Planning : indigo / ambre / violet
  const typeBadge = (type?: string) =>
    type === 'aller-retour'
      ? 'bg-violet-50 text-violet-700 border-violet-200'
      : type === 'aller'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : 'bg-amber-50 text-amber-700 border-amber-300';

  const typeLabel = (type?: string) =>
    type === 'aller-retour' ? 'Aller-Retour' : type === 'aller' ? 'Aller' : 'Retour';

  const typeAccent = (type?: string) =>
    type === 'aller-retour'
      ? { text: 'text-violet-600', ring: 'ring-violet-300', avatar: 'bg-violet-100 text-violet-600' }
      : type === 'retour'
      ? { text: 'text-amber-600', ring: 'ring-amber-300', avatar: 'bg-amber-100 text-amber-700' }
      : { text: 'text-indigo-600', ring: 'ring-indigo-300', avatar: 'bg-indigo-100 text-indigo-600' };

  const statusBadge = (status?: string) =>
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'in_progress'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  const statusLabel = (status?: string) =>
    status === 'completed' ? 'Terminée' : status === 'in_progress' ? 'En cours' : 'Programmée';

  const missionDate = (m: any) => {
    const d = m?.date?.toDate ? m.date.toDate() : m?.date ? new Date(m.date) : null;
    return d ? format(d, 'EEEE d MMMM yyyy', { locale: fr }) : '';
  };

  const matchesSearch = (m: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.child?.name?.toLowerCase().includes(q) ||
      m.parent?.name?.toLowerCase().includes(q) ||
      m.from?.address?.toLowerCase().includes(q) ||
      m.to?.address?.toLowerCase().includes(q)
    );
  };

  const matchesType = (m: any) =>
    typeFilter === 'all' || (m.transportType ?? 'retour') === typeFilter;

  const pendingMissions = missions.filter(m => (m.status === 'programmed' || m.status === 'in_progress') && matchesSearch(m) && matchesType(m));
  const completedMissions = missions.filter(m => m.status === 'completed' && matchesSearch(m) && matchesType(m));
  const visibleMissions = tab === 'pending' ? pendingMissions : completedMissions;

  const detailAccent = typeAccent(selectedMission?.transportType);

  const filterOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'Tous les trajets' },
    { value: 'aller', label: 'Aller' },
    { value: 'retour', label: 'Retour' },
    { value: 'aller-retour', label: 'Aller-Retour' },
  ];

  const EmptyMissions = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center gap-5 py-10 text-center sm:flex-row sm:text-left">
      <div className="h-28 w-[102px] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">Profitez de votre journée !</p>
      </div>
    </div>
  );

  // Ligne mission — éditorial, plat : gros horaire + contenu + actions
  const renderMission = (mission: any, completed: boolean) => (
    <div key={mission.id} className="py-5 first:pt-0">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-[92px_1fr]">
        {/* Horaire typographique */}
        <div>
          <p className={cn('text-3xl font-bold tracking-tight', completed ? 'text-slate-400' : 'text-foreground')}>
            {mission.time}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Départ
          </p>
        </div>

        {/* Contenu */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={mission.child?.avatar || ''} alt={mission.child.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <h3 className="font-brand text-lg font-semibold">
              {mission.child.name}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">{mission.child.age} ans</span>
            </h3>
            {mission.transportType && (
              <Badge variant="outline" className={cn('h-5 px-2 py-0 text-[10px] uppercase tracking-wide', typeBadge(mission.transportType))}>
                {typeLabel(mission.transportType)}
              </Badge>
            )}
            {completed ? (
              <Badge variant="outline" className={cn('h-5 px-2 py-0 text-[10px]', statusBadge('completed'))}>
                Terminée
              </Badge>
            ) : (
              isMissionActive(mission.id) && (
                <Badge variant="outline" className={cn('h-5 px-2 py-0 text-[10px]', statusBadge('in_progress'))}>
                  En cours
                </Badge>
              )
            )}
          </div>

          {mission.child.needs?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              {mission.child.needs.map((need: string, i: number) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="h-5 border-amber-300/70 bg-transparent py-0 text-[10px] font-normal text-amber-700"
                >
                  {need}
                </Badge>
              ))}
            </div>
          )}

          {/* Itinéraire — points reliés par tirets pointillés */}
          <div className="mt-3">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{mission.from.name}</p>
                <p className="truncate text-xs text-muted-foreground">{mission.from.address}</p>
              </div>
            </div>
            <div className="my-1 ml-[4px] h-4 w-0 border-l-2 border-dashed border-slate-300" />
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{mission.to.name}</p>
                <p className="truncate text-xs text-muted-foreground">{mission.to.address}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!completed && (
              !isMissionActive(mission.id) ? (
                <Button
                  className="h-9 bg-primary px-4 text-xs hover:bg-primary/90"
                  onClick={() => handleStartMission(mission)}
                  disabled={trackingLoading}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Commencer la mission
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="h-9 px-4 text-xs"
                  onClick={() => handleCompleteMission(mission)}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Terminer
                </Button>
              )
            )}
            <Button
              variant="outline"
              className="h-9 px-4 text-xs"
              onClick={() => handleShowDetails(mission)}
            >
              Voir détails
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-3 text-xs text-muted-foreground"
                >
                  <MoreVertical className="mr-1 h-3.5 w-3.5" />
                  Plus
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => handleShowNeeds(mission)}>
                  Voir besoins
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleShowItinerary(mission)}>
                  Voir l&apos;itinéraire
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="ml-auto flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {missionDate(mission)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête standard */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Missions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos missions de transport
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une mission"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-none border-0 border-b border-slate-300 bg-transparent pl-6 shadow-none focus-visible:ring-0 sm:w-[240px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn('gap-1.5 text-xs', typeFilter !== 'all' && 'text-primary')}
                aria-label="Filtrer par type de trajet"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtre
                {typeFilter !== 'all' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {filterOptions.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => setTypeFilter(opt.value)}
                  className="flex items-center justify-between text-xs"
                >
                  {opt.label}
                  {typeFilter === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Onglets à souligné */}
      <div className="flex items-center gap-6 border-b">
        {([
          { key: 'pending' as const, label: 'À venir', count: pendingMissions.length },
          { key: 'completed' as const, label: 'Terminées', count: completedMissions.length },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              '-mb-px border-b-2 pb-2.5 text-sm transition-colors',
              tab === t.key
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-muted-foreground">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Liste + fiche latérale */}
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="divide-y">
          {visibleMissions.length === 0 && (
            <EmptyMissions label={tab === 'pending' ? 'Aucune mission à venir' : 'Aucune mission terminée'} />
          )}
          {visibleMissions.map(m => renderMission(m, tab === 'completed'))}
        </div>

        {/* Résumé — rail latéral */}
        {visibleMissions.length > 0 && (
          <aside className="hidden self-start lg:sticky lg:top-6 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Résumé
            </p>
            <div className="mt-3 divide-y border-y">
              {pendingMissions[0] && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Prochain départ</span>
                  <span className="truncate text-xs font-medium">
                    {pendingMissions[0].time} · {pendingMissions[0].child.name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-xs text-muted-foreground">Missions à venir</span>
                <span className="text-xs font-medium">{pendingMissions.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-xs text-muted-foreground">Distance à parcourir</span>
                <span className="text-xs font-medium">
                  {(pendingMissions.reduce((acc, m) => acc + (m.distance || 0), 0) / 1000).toFixed(0)} km
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-xs text-muted-foreground">Terminées</span>
                <span className="text-xs font-medium">{completedMissions.length}</span>
              </div>
            </div>

            {/* Carte aide */}
            <div className="mt-4 bg-slate-900 p-4 text-white">
              <p className="text-sm font-semibold">Une question en route ?</p>
              <p className="mt-1 text-xs text-slate-300">
                Écrivez à l&apos;équipe ou aux parents depuis la messagerie.
              </p>
              <button
                onClick={() => router.push('/driver/messages')}
                className="mt-2.5 text-xs font-medium text-amber-400 underline underline-offset-2 hover:text-amber-300"
              >
                Ouvrir la messagerie
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Modal Besoins */}
      {openNeeds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={handleCloseDialogs}>
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Besoins de l&apos;enfant</h2>
            </div>
            <div className="mb-5">
              {selectedMission?.child?.needs && selectedMission.child.needs.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {selectedMission.child.needs.map((need: string, i: number) => (
                    <li key={i}>{need}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun besoin particulier.</p>
              )}
            </div>
            <Button className="w-full" onClick={handleCloseDialogs}>
              Fermer
            </Button>
          </div>
        </div>
      )}

      {/* Détail mission — panneau latéral droit, style carte profil */}
      <Sheet open={openDetails} onOpenChange={handleCloseDialogs}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-md">
          {selectedMission && (
            <>
              {/* Profil centré */}
              <div className="flex flex-col items-center px-5 pb-5 pt-10 text-center">
                <Avatar className={cn('h-20 w-20 border-4 border-white ring-2', detailAccent.ring)}>
                  <AvatarImage src={selectedMission.child?.avatar || ''} alt={selectedMission.child?.name || 'Enfant'} />
                  <AvatarFallback className={cn('text-lg font-semibold', detailAccent.avatar)}>
                    {(selectedMission.child?.name || 'E')[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-3 text-lg font-bold tracking-tight">{selectedMission.child?.name}</h2>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">{missionDate(selectedMission)}</p>
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

                {/* Actions */}
                <div className="mt-4 flex w-full items-center gap-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleShowItinerary(selectedMission)}
                  >
                    <RouteIcon className="mr-1.5 h-4 w-4" />
                    Démarrer l&apos;itinéraire
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => router.push('/driver/messages')}
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
                    Prise en charge à <span className={cn('font-bold', detailAccent.text)}>{selectedMission.time || '—'}</span>
                  </p>
                </div>

                {/* Itinéraire — tirets pointillés */}
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
                        <p className="mt-0.5 break-words text-sm">{selectedMission.from?.address}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Arrivée</p>
                        <p className="mt-0.5 break-words text-sm">{selectedMission.to?.address}</p>
                      </div>
                    </div>
                  </div>
                  {selectedMission.distance > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                      <RouteIcon className="h-3.5 w-3.5" />
                      {(selectedMission.distance / 1000).toFixed(1)} km
                    </p>
                  )}
                </div>

                {/* Parent */}
                {selectedMission.parent?.name && (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="bg-slate-100">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{selectedMission.parent.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">Parent</span>
                  </div>
                )}

                {/* Besoins */}
                {selectedMission.child?.needs?.length > 0 && (
                  <div className="flex items-start gap-3 px-5 py-3.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Besoins spécifiques</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {selectedMission.child.needs.map((need: string, i: number) => (
                          <Badge key={i} variant="outline" className="h-5 border-primary/20 bg-primary/5 py-0 text-[10px] text-primary">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Personnalité */}
                {selectedMission.child?.personality && (
                  <div className="flex items-start gap-3 px-5 py-3.5">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Personnalité</p>
                      <p className="break-words text-sm font-medium">{selectedMission.child.personality}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* RouteModal réutilisable */}
      <RouteModal
        isOpen={showRouteModal}
        onClose={handleCloseRouteModal}
        mission={selectedMission}
      />
    </div>
  );
}
