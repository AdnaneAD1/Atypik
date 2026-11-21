'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTracking } from '@/hooks/use-tracking';
import { RouteModal } from '@/components/driver/route-modal';
import { cn } from '@/lib/utils';

interface DriverMissionCardProps {
  mission?: {
    id: string;
    transportId: string;
    status: 'started' | 'in_progress' | 'completed';
    child: {
      name: string;
      age: number;
      avatar?: string;
      needs?: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
    };
    parent: {
      name: string;
      avatar?: string;
      phone?: string;
    };
    from: {
      name: string;
      address: string;
      lat?: number;
      lng?: number;
    };
    to: {
      name: string;
      address: string;
      lat?: number;
      lng?: number;
    };
    timeEstimate: string;
    distance: number;
    scheduledTime: string;
    progress: number;
    time: string;
    transportType: 'aller' | 'retour' | 'aller-retour';
  };
  onCompleted?: () => void;
}

function DriverMissionCard({ mission, onCompleted }: DriverMissionCardProps) {
  const [showNeeds] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { completeMission, loading, listenMissionByTransport } = useTracking();
  const [liveProgress, setLiveProgress] = useState<number | null>(null);

  // Progression en direct : recalculée à chaque position GPS reçue
  useEffect(() => {
    setLiveProgress(null);
    if (!mission?.transportId || !mission?.from?.lat || !mission?.to?.lat) return;

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

    const from = { lat: mission.from.lat!, lng: mission.from.lng! };
    const to = { lat: mission.to.lat!, lng: mission.to.lng! };
    const total = hav(from, to);
    if (total <= 0) return;

    const unsubscribe = listenMissionByTransport(mission.transportId, (m) => {
      if (m?.currentPosition) {
        const done = hav(from, m.currentPosition);
        setLiveProgress(Math.min(100, Math.max(0, (done / total) * 100)));
      }
    });
    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.transportId, listenMissionByTransport]);

  // Si aucune mission active, afficher un message
  if (!mission) {
    return (
      <Card className="rounded-[6px_28px_6px_28px] border bg-card shadow-none">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-8 sm:text-left">
            <div className="relative h-40 w-56 shrink-0 sm:h-44 sm:w-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pas-de-mission.png"
                alt="Chauffeur en pause à côté de sa voiture"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Aucune mission active</h3>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Profitez de votre pause - votre prochaine mission
                apparaîtra ici dès qu&apos;elle commencera.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const handleViewMap = () => {
    setShowMap(true);
  };

  const handleCloseNeeds = () => {
    // La popup besoins n'est plus déclenchée depuis cette carte
  };

  const handleCloseMap = () => {
    setShowMap(false);
  };

  const handleCompleteMission = async () => {
    if (!mission?.id) return;
    const ok = await completeMission(mission.id);
    if (ok) {
      onCompleted?.();
    }
  };

  // Composant pour la popup des besoins
  const NeedsPopup = () => {
    if (!showNeeds) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseNeeds}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card max-w-md w-full rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-lg">Besoins spécifiques</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseNeeds}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mission.child.avatar || ''} alt={mission.child.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {mission.child.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-base">{mission.child.name}</h4>
                  <p className="text-sm text-muted-foreground">{mission.child.age} ans</p>
                </div>
              </div>

              <div className="space-y-3">
                {mission.child.needs?.map((need, index) => (
                  <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-amber-700">{need.type || need.description}</h5>
                        <p className="text-sm text-amber-600/80 mt-1">
                          {need.description || (need.type === 'TDAH' ?
                            'Peut avoir besoin d\'attention supplémentaire et de patience. Préfère un environnement calme.' :
                            'Besoin spécial à prendre en compte.')}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="outline" onClick={handleCloseNeeds}>
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Distance restante estimée à partir de la progression réelle
  const progress = Math.min(Math.max(liveProgress ?? mission.progress ?? 0, 0), 100);
  const remaining = Math.max((mission.distance || 0) * (1 - progress / 100), 0);
  const remainingKm = remaining / 1000;
  // « En route » = une position GPS existe réellement (live reçue ou progression déjà entamée)
  const isEnRoute = liveProgress !== null || progress > 0;

  const typeLabel =
    mission.transportType === 'aller-retour'
      ? 'Aller-retour'
      : mission.transportType === 'aller'
        ? 'Aller'
        : 'Retour';

  return (
    <>
      <Card className="rounded-[6px_28px_6px_28px] border bg-card shadow-none">
        <div className="p-6 sm:p-8">
          {/* Titre + phases */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Transport en cours</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={mission.child.avatar || ''} alt={mission.child.name} />
                  <AvatarFallback className="bg-brand-yellow font-brand text-lg font-bold text-slate-900">
                    {mission.child.name[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="font-brand text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                  {mission.child.name}
                  <span className="ml-2.5 inline-block rounded-full bg-brand-pink/15 px-3 py-0.5 align-middle text-sm font-bold text-brand-pink">
                    {typeLabel}
                  </span>
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Étape du transport">
              <span
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm',
                  !isEnRoute
                    ? 'bg-brand-yellow/25 font-bold text-amber-800 ring-1 ring-inset ring-brand-yellow'
                    : 'bg-slate-100 text-muted-foreground'
                )}
                aria-current={!isEnRoute ? 'step' : undefined}
              >
                En préparation
              </span>
              <span
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm',
                  isEnRoute
                    ? 'bg-brand-yellow/25 font-bold text-amber-800 ring-1 ring-inset ring-brand-yellow'
                    : 'bg-slate-100 text-muted-foreground'
                )}
                aria-current={isEnRoute ? 'step' : undefined}
              >
                En route
              </span>
            </div>
          </div>

          {/* Rail de progression — marqueur voiture + bulle km restant */}
          <div className="mt-14">
            <div
              className="relative h-4"
              role="img"
              aria-label={`${remainingKm.toFixed(1).replace('.', ',')} km restant sur le trajet`}
            >
              <div
                className="absolute left-0 top-[5px] h-1.5 rounded-full bg-brand-teal"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute right-0 top-[6px] h-0 border-t-4 border-dashed border-slate-300"
                style={{ left: `${progress}%` }}
              />
              <span className="absolute left-0 top-0 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-600 ring-1 ring-slate-300" />
              <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-[3px] border-white bg-primary ring-1 ring-slate-300" />
              <span
                className="absolute top-0 h-4 w-4 rounded-full border-[3px] border-white bg-brand-teal shadow-[0_0_0_6px_rgba(20,148,155,0.22)]"
                style={{ left: `${progress}%`, marginLeft: '-8px' }}
              >
                <span className="absolute bottom-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-brand-teal px-3.5 py-1 font-brand text-base font-bold text-white">
                  {remainingKm.toFixed(1).replace('.', ',')} km restant
                </span>
                <span className="absolute bottom-[24px] left-1/2 -ml-1.5 border-[6px] border-transparent border-t-brand-teal" />
              </span>
            </div>
            <div className="mt-4 flex justify-between gap-6">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900">{mission.from.address}</p>
                <p className="text-sm text-muted-foreground">Départ à {mission.time}</p>
              </div>
              <div className="min-w-0 shrink-0 text-right">
                <p className="truncate text-base font-bold text-slate-900">{mission.to.address}</p>
                <p className="text-sm text-muted-foreground">
                  Destination · {((mission.distance || 0) / 1000).toFixed(1).replace('.', ',')} km
                </p>
              </div>
            </div>
          </div>

          {/* Pied : parent + actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
            <p className="text-sm text-muted-foreground">
              Parent : <span className="font-bold text-slate-900">{mission.parent.name}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                className="min-h-[44px] px-1 text-sm font-bold text-primary underline decoration-2 underline-offset-4"
                onClick={handleCompleteMission}
                disabled={loading}
              >
                Terminer
              </button>
              <Button
                variant="outline"
                className="h-12 border-[1.5px] border-slate-900 px-5 font-bold text-slate-900 hover:bg-slate-100"
                onClick={handleViewMap}
              >
                Démarrer le GPS
              </Button>
              <Button
                className="h-12 bg-primary px-5 font-bold text-white hover:bg-primary/90"
                onClick={handleViewMap}
              >
                <Play className="mr-1.5 h-4 w-4" />
                Démarrer l&apos;itinéraire
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Popups */}
      <NeedsPopup />
      <RouteModal
        isOpen={showMap}
        onClose={handleCloseMap}
        mission={mission ? {
          id: mission.id,
          child: { name: mission.child.name, age: mission.child.age },
          parent: { name: mission.parent.name },
          from: { name: mission.from.name, address: mission.from.address, lat: mission.from.lat, lng: mission.from.lng },
          to: { name: mission.to.name, address: mission.to.address, lat: mission.to.lat, lng: mission.to.lng },
          scheduledTime: mission.scheduledTime,
          distance: typeof mission.distance === 'number' ? mission.distance : parseFloat(String(mission.distance)) || 0,
          transportType: mission.transportType,
        } : null}
      />
    </>
  );
}

export { DriverMissionCard };
export default DriverMissionCard;
