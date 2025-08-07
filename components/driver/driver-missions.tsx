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

export function DriverMissions() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const driverId = user?.id;
  const { missions, loading, error, refresh } = useMissions(driverId || '');
  const { startMission, activeMissions, isTracking, loading: trackingLoading } = useTracking();

  // Dialog state
  const [openNeeds, setOpenNeeds] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openItinerary, setOpenItinerary] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Google Maps refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const handleShowNeeds = (mission: any) => {
    setSelectedMission(mission);
    setOpenNeeds(true);
  };

  const handleShowDetails = (mission: any) => {
    setSelectedMission(mission);
    setOpenDetails(true);
  };

  const handleShowItinerary = (mission: any) => {
    setSelectedMission(mission);
    setOpenItinerary(true);
  };

  const handleCloseDialogs = () => {
    setOpenNeeds(false);
    setOpenDetails(false);
    setOpenItinerary(false);
    setSelectedMission(null);
    setIsMapLoaded(false);
    // Nettoyer les références de la carte
    if (routeRendererRef.current) {
      routeRendererRef.current.setMap(null);
      routeRendererRef.current = null;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
  };

  // Initialiser Google Maps (identique à parent-tracking.tsx pour des performances optimales)
  const initializeMap = () => {
    if (!mapRef.current || !window.google || !selectedMission) return;

    const defaultCenter = {
      lat: selectedMission.from.lat || 48.8566,
      lng: selectedMission.from.lng || 2.3522
    };

    try {
      // Marquer immédiatement comme chargé pour améliorer l'UX
      setIsMapLoaded(true);
      
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        // Optimisations pour un chargement plus rapide
        gestureHandling: 'cooperative',
        disableDefaultUI: false,
        clickableIcons: false,
      });

      // Ajouter les marqueurs de départ et d'arrivée
      new google.maps.Marker({
        position: { lat: selectedMission.from.lat || 48.8566, lng: selectedMission.from.lng || 2.3522 },
        map: mapInstanceRef.current,
        title: 'Point de départ',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10B981"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
      });

      new google.maps.Marker({
        position: { lat: selectedMission.to.lat || 48.8566, lng: selectedMission.to.lng || 2.3522 },
        map: mapInstanceRef.current,
        title: 'Destination',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EF4444"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
      });

      // Afficher l'itinéraire de manière asynchrone pour ne pas bloquer l'affichage
      setTimeout(() => {
        const directionsService = new google.maps.DirectionsService();
        routeRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4,
          },
        });
        routeRendererRef.current.setMap(mapInstanceRef.current);

        directionsService.route(
          {
            origin: { lat: selectedMission.from.lat || 48.8566, lng: selectedMission.from.lng || 2.3522 },
            destination: { lat: selectedMission.to.lat || 48.8566, lng: selectedMission.to.lng || 2.3522 },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK' && routeRendererRef.current) {
              routeRendererRef.current.setDirections(result);
            }
          }
        );
      }, 100);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  };

  // Effet pour initialiser la carte quand le popup d'itinéraire s'ouvre
  useEffect(() => {
    if (openItinerary && selectedMission && window.google) {
      setTimeout(initializeMap, 100);
    }
  }, [openItinerary, selectedMission, initializeMap]);

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
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">
                          {mission.child.name} ({mission.child.age} ans)
                        </h4>
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
                              <DropdownMenuItem 
                                onSelect={() => handleStartMission(mission)}
                                disabled={isMissionActive(mission.id) || trackingLoading}
                              >
                                {isMissionActive(mission.id) ? 'Mission en cours' : 'Commencer le trajet'}
                              </DropdownMenuItem>
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

      {/* Modal Itinéraire */}
      {openItinerary && selectedMission && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseDialogs}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card max-w-4xl w-full h-[80vh] rounded-xl shadow-xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-primary/10 border-b border-primary/20 p-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Itinéraire de la mission</h3>
                    <p className="text-sm text-muted-foreground">{selectedMission.child.name} • {selectedMission.scheduledTime || '00:00'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseDialogs}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Informations du trajet */}
              <div className="p-4 border-b border-border flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium">Départ</p>
                      <p className="text-xs text-muted-foreground">{selectedMission.from.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div>
                      <p className="text-sm font-medium">Arrivée</p>
                      <p className="text-xs text-muted-foreground">{selectedMission.to.address}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Distance: {selectedMission.distance?.toFixed(1) || '0.0'} km</span>
                  <span>•</span>
                  <span>Type: {selectedMission.transportType === 'aller' ? 'Aller' : 'Retour'}</span>
                </div>
              </div>
              
              {/* Carte Google Maps */}
              <div className="flex-1 relative">
                {!isMapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Chargement de l&apos;itinéraire...</p>
                    </div>
                  </div>
                )}
                <div 
                  ref={mapRef} 
                  className="w-full h-full"
                  style={{ minHeight: '300px' }}
                />
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-border flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Itinéraire calculé par Google Maps</span>
                </div>
                <Button variant="outline" onClick={handleCloseDialogs}>
                  Fermer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div >
  );
}