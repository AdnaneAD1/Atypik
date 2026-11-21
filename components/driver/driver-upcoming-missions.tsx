'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { RouteModal } from './route-modal';
import { useAuth } from '@/lib/auth/auth-context';
import { useTracking } from '@/hooks/use-tracking';

interface UpcomingMission {
  id: string;
  child: {
    name: string;
    age: number;
    avatar?: string;
    needs?: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
  };
  parent: {
    name: string;
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
  scheduledTime: string;
  distance: number;
  transportType: 'aller' | 'retour' | 'aller-retour';
}

interface DriverUpcomingMissionsProps {
  missions?: UpcomingMission[];
  onStarted?: () => void;
}

export function DriverUpcomingMissions({ missions, onStarted }: DriverUpcomingMissionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { startMission, loading: trackingLoading } = useTracking();
  // Utiliser les missions passées en props ou les données par défaut
  const upcomingMissions = missions || [];
  
  // États pour gérer les popups
  const [selectedMission, setSelectedMission] = useState<UpcomingMission | null>(null);
  const [showNeedsPopup, setShowNeedsPopup] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  
  // Fonctions pour gérer les actions des boutons
  const handleShowNeeds = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowNeedsPopup(true);
  };
  
  const handleShowRoute = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowRouteModal(true);
  };

  const handleViewAllMissions = () => {
    router.push('/driver/missions');
  };

  // Démarrer une mission directement depuis le tableau de bord
  const handleStartMission = async (mission: UpcomingMission) => {
    try {
      const missionData = {
        driverId: user?.id!,
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
      if (result) onStarted?.();
    } catch (error) {
      console.error('Erreur lors du démarrage de la mission:', error);
    }
  };
  
  const handleClosePopup = () => {
    setShowNeedsPopup(false);
    setShowRouteModal(false);
  };

  
  // Composant pour afficher les besoins de l'enfant
  const NeedsPopup = () => {
    if (!showNeedsPopup || !selectedMission) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClosePopup}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card max-w-md w-full rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-primary/10 border-b border-primary/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Besoins spécifiques</h3>
                  <p className="text-sm text-muted-foreground">{selectedMission.child.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClosePopup}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              {selectedMission.child.needs && selectedMission.child.needs.length > 0 ? (
                <div className="space-y-3">
                  {selectedMission.child.needs.map((need, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        need.severity === 'high' ? 'bg-red-500' :
                        need.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{need.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">{need.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium">Aucun besoin spécifique</p>
                  <p className="text-xs text-muted-foreground mt-1">Cet enfant n&apos;a pas de besoins particuliers</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border flex justify-end">
              <Button variant="outline" onClick={handleClosePopup}>
                Fermer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  // Composant pour afficher les détails de la mission avec carte Google Maps
  
  
  return (
    <>
      <section>
        <h2 className="font-brand text-2xl font-bold tracking-tight text-slate-900">Missions à venir</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aujourd&apos;hui · {upcomingMissions.length} mission{upcomingMissions.length > 1 ? 's' : ''} planifiée{upcomingMissions.length > 1 ? 's' : ''}
        </p>

        {upcomingMissions.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-5 border-t-2 border-slate-900 py-8 text-center sm:flex-row sm:text-left">
            {/* Illustration : voiture extraite du logo de marque */}
            <div className="h-28 w-[102px] shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-horizontal.png"
                alt=""
                className="h-full w-full object-cover object-left"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Pas d&apos;autres trajets prévus pour aujourd&apos;hui.<br />
                Profitez de votre journée !
              </p>
              <Button
                variant="outline"
                className="mt-4 border-primary/40 text-primary hover:bg-primary/5 hover:text-primary"
                onClick={handleViewAllMissions}
              >
                Voir toutes les missions
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t-2 border-slate-900">
            <div className="divide-y divide-slate-200">
              {upcomingMissions.map((mission) => {
                const totalKm = ((mission.distance * (mission.transportType === 'aller-retour' ? 2 : 1)) / 1000).toFixed(1).replace('.', ',');
                return (
                  <article
                    key={mission.id}
                    className="grid grid-cols-1 gap-x-8 gap-y-4 py-6 sm:grid-cols-[auto_minmax(0,1fr)]"
                  >
                    {/* Gros horaire */}
                    <p className="font-brand text-4xl font-bold leading-none tracking-tight text-slate-900 sm:text-5xl">
                      {mission.scheduledTime || '—'}
                    </p>

                    <div className="min-w-0">
                      {/* Nom + photo + type */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Avatar className="h-11 w-11 shrink-0">
                          <AvatarImage src={mission.child.avatar || ''} alt={mission.child.name} />
                          <AvatarFallback className="bg-brand-yellow font-brand text-sm font-bold text-slate-900">
                            {(mission.child.name || 'E').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-brand text-xl font-bold text-slate-900">
                          {mission.child.name}
                          <span className="ml-2 inline-block rounded-full bg-brand-pink/15 px-3 py-0.5 align-middle text-sm font-bold text-brand-pink">
                            {mission.transportType === 'aller-retour'
                              ? 'Aller-retour'
                              : mission.transportType === 'aller'
                                ? 'Aller'
                                : 'Retour'}
                          </span>
                        </h3>
                      </div>

                      {/* Étapes du trajet — filet pointillé vertical */}
                      <ul className="relative mt-4 space-y-4">
                        <span
                          aria-hidden="true"
                          className="absolute bottom-6 left-[5px] top-3 w-0 border-l-2 border-dotted border-slate-300"
                        />
                        <li className="relative pl-7">
                          <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-emerald-600" />
                          <p className="truncate text-sm font-bold text-slate-900">{mission.from.address}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Départ prévu à {mission.scheduledTime || '—'}
                          </p>
                        </li>
                        <li className="relative pl-7">
                          <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary" />
                          <p className="truncate text-sm font-bold text-slate-900">{mission.to.address}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Destination</p>
                        </li>
                        {mission.transportType === 'aller-retour' && (
                          <li className="relative pl-7">
                            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand-yellow" />
                            <p className="truncate text-sm font-bold text-slate-900">{mission.from.address}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Retour</p>
                          </li>
                        )}
                      </ul>

                      {/* Infos */}
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>Parent : <b className="font-bold text-slate-900">{mission.parent.name}</b></span>
                        <span><b className="font-bold text-slate-900">{totalKm} km</b> au total</span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <Button
                          className="h-11 bg-primary px-6 font-bold text-white hover:bg-primary/90"
                          onClick={() => handleStartMission(mission)}
                          disabled={trackingLoading}
                        >
                          <Play className="mr-1.5 h-4 w-4" />
                          Démarrer
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 border-[1.5px] border-slate-900 px-6 font-bold text-slate-900 hover:bg-slate-100"
                          onClick={() => handleShowRoute(mission)}
                        >
                          Itinéraire
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {upcomingMissions.length > 0 && (
          <p className="mt-4">
            <button
              className="min-h-[44px] text-sm font-bold text-primary underline decoration-2 underline-offset-4"
              onClick={handleViewAllMissions}
            >
              Voir toutes les missions
            </button>
          </p>
        )}
      </section>
    
    {/* Rendu des popups */}
    <NeedsPopup />
    <RouteModal 
      isOpen={showRouteModal}
      onClose={() => setShowRouteModal(false)}
      mission={selectedMission}
    />
  </>
  );
}
