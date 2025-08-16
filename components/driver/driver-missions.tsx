'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Filter, Clock, User, AlertTriangle, Navigation, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';


import { useAuth } from '@/lib/auth/auth-context';
import { useMissions } from '@/hooks/use-missions';
import { useTracking } from '@/hooks/use-tracking';
import { RouteModal } from './route-modal';

export function DriverMissions() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const driverId = user?.id;
  const { missions, loading, error, refresh } = useMissions(driverId || '');
  const { startMission, completeMission, activeMissions, isTracking, loading: trackingLoading, getActiveMissionByTransport } = useTracking();

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

  // Plus besoin de logique Google Maps complexe - utilisation du RouteModal réutilisable

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Missions</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos missions de transport
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Liste des missions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">À venir</TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {missions
                .filter(m => m.status === 'pending')
                .map(mission => (
                  <div
                    key={mission.id}
                    className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-medium">
                      {(mission as any).time}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">
                          {mission.child.name} ({mission.child.age} ans)
                        </h4>
                        {(mission as any).transportType && (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] h-5 py-0 px-2 ${
                              (mission as any).transportType === 'aller-retour'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : (mission as any).transportType === 'aller'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-orange-50 text-orange-700 border-orange-200'
                            }`}
                          >
                            {
                              (mission as any).transportType === 'aller-retour'
                                ? 'Aller-Retour'
                                : (mission as any).transportType === 'aller'
                                ? 'Aller'
                                : 'Retour'
                            }
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {mission.child.needs.map((need, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px] h-5 py-0 bg-primary/5 text-primary border-primary/20"
                          >
                            {need}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{mission.from.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {mission.from.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{mission.to.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {mission.to.address}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-muted-foreground">
                          <Clock className="inline mr-1 h-4 w-4 align-middle" />
                          {mission.date && (typeof mission.date.toDate === 'function'
                            ? mission.date.toDate().toLocaleDateString('fr-FR')
                            : new Date(mission.date.toDate()).toLocaleDateString('fr-FR'))}
                        </div>
                        <div className="relative">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
                                <span className="sr-only">Ouvrir menu</span>
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="19" cy="12" r="2" fill="currentColor" /></svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleShowDetails(mission)}>
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleShowNeeds(mission)}>
                                Voir besoins
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleShowItinerary(mission)}>
                                Itinéraire
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!isMissionActive(mission.id) ? (
                                <DropdownMenuItem 
                                  onSelect={() => handleStartMission(mission)}
                                  disabled={trackingLoading}
                                >
                                  Commencer le trajet
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onSelect={() => handleCompleteMission(mission)}
                                >
                                  Terminer le trajet
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {missions
                .filter(m => m.status === 'done')
                .map(mission => (
                  <div
                    key={mission.id}
                    className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg opacity-75"
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-medium">
                      {(mission as any).time}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">
                            {mission.child.name} ({mission.child.age} ans)
                          </h4>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          Terminée
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {mission.child.needs.map((need, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px] h-5 py-0 bg-primary/5 text-primary border-primary/20"
                          >
                            {need}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{mission.from.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {mission.from.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{mission.to.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {mission.to.address}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal Besoins */}
      {openNeeds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h2 className="text-lg font-bold mb-2">Besoins de l&apos;enfant</h2>
            <div className="py-2 mb-4">
              {selectedMission?.child?.needs && selectedMission.child.needs.length > 0 ? (
                <ul className="list-disc pl-5">
                  {selectedMission.child.needs.map((need: string, i: number) => (
                    <li key={i}>{need}</li>
                  ))}
                </ul>
              ) : (
                <p>Aucun besoin particulier.</p>
              )}
            </div>
            <button
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              onClick={handleCloseDialogs}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {openDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h2 className="text-lg font-bold mb-2">Détails du transport</h2>
            <div className="py-2 space-y-2 mb-4">
              <div><b>Parent:</b> {selectedMission?.parent.name || 'N/A'}</div>
              <div><b>Enfant:</b> {selectedMission?.child?.name || 'N/A'}</div>
              <div><b>Âge:</b> {selectedMission?.child?.age || 'N/A'} ans</div>
              <div><b>Besoins:</b> {selectedMission?.child?.needs && selectedMission.child.needs.length > 0 ? selectedMission.child.needs.join(', ') : 'Aucun'}</div>
              {selectedMission?.child?.personality && (
                <div><b>Personnalité:</b> {selectedMission.child.personality}</div>
              )}
              <div><b>Date:</b> {selectedMission?.date && (typeof selectedMission.date.toDate === 'function' ? selectedMission.date.toDate().toLocaleDateString('fr-FR') : new Date(selectedMission.date).toLocaleDateString('fr-FR'))}</div>
              <div><b>Départ:</b> {selectedMission?.from?.name} — {selectedMission?.from?.address}</div>
              <div><b>Arrivée:</b> {selectedMission?.to?.name} — {selectedMission?.to?.address}</div>
            </div>
            <button
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              onClick={handleCloseDialogs}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* RouteModal réutilisable */}
      <RouteModal
        isOpen={showRouteModal}
        onClose={handleCloseRouteModal}
        mission={selectedMission}
      />
    </div >
  );
}