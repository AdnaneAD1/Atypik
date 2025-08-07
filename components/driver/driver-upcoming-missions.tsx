'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, AlertTriangle, CheckCircle2, Navigation, Phone, Car, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedRoute } from '@/components/ui/animated-route';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useRouter } from 'next/navigation';

interface UpcomingMission {
  id: string;
  child: {
    name: string;
    age: number;
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
  transportType: 'aller' | 'retour';
}

interface DriverUpcomingMissionsProps {
  missions?: UpcomingMission[];
}

export function DriverUpcomingMissions({ missions }: DriverUpcomingMissionsProps) {
  const router = useRouter();
  // Utiliser les missions passées en props ou les données par défaut
  const upcomingMissions = missions || [];
  
  // États pour gérer les popups
  const [selectedMission, setSelectedMission] = useState<UpcomingMission | null>(null);
  const [showNeedsPopup, setShowNeedsPopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Refs pour Google Maps
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  // Fonctions pour gérer les actions des boutons
  const handleShowNeeds = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowNeedsPopup(true);
  };
  
  const handleShowDetails = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowDetailsPopup(true);
  };

  const handleViewAllMissions = () => {
    router.push('/driver/calendar');
  };
  
  const handleClosePopup = () => {
    setShowNeedsPopup(false);
    setShowDetailsPopup(false);
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
  
  // Initialiser Google Maps pour l'itinéraire (optimisé pour un chargement plus rapide)
  const initializeMap = async () => {
    if (!mapRef.current || !window.google || !selectedMission) return;

    const defaultCenter = {
      lat: selectedMission.from.lat || 48.8566,
      lng: selectedMission.from.lng || 2.3522
    };

    try {
      // Créer la carte immédiatement
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        // Optimisations pour un chargement plus rapide
        gestureHandling: 'cooperative',
        disableDefaultUI: false,
        clickableIcons: false,
      });

      // Marquer immédiatement comme chargé pour améliorer l'UX
      setIsMapLoaded(true);

      // Préparer les services Google Maps en parallèle
      const directionsService = new google.maps.DirectionsService();
      routeRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
        },
      });
      routeRendererRef.current.setMap(mapInstanceRef.current);

      // Calculer l'itinéraire en premier pour déterminer le meilleur zoom
      const routePromise = new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: { lat: selectedMission.from.lat || 48.8566, lng: selectedMission.from.lng || 2.3522 },
            destination: { lat: selectedMission.to.lat || 48.8566, lng: selectedMission.to.lng || 2.3522 },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      // Afficher l'itinéraire dès qu'il est calculé
      try {
        const result = await routePromise;
        if (routeRendererRef.current) {
          routeRendererRef.current.setDirections(result);
          
          // Ajouter les marqueurs personnalisés après l'itinéraire
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
            zIndex: 1000,
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
            zIndex: 1000,
          });
        }
      } catch (error) {
        console.error('Erreur lors du calcul de l\'itinéraire:', error);
        // La carte est déjà marquée comme chargée, pas besoin de le refaire
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      // En cas d'échec complet, on garde quand même le statut chargé pour éviter un loader infini
    }
  };
  
  // Effet pour initialiser la carte quand le popup des détails s'ouvre
  useEffect(() => {
    if (showDetailsPopup && selectedMission && window.google) {
      setTimeout(initializeMap, 100);
    }
  }, [showDetailsPopup, selectedMission]);
  
  // Composant pour afficher les besoins de l'enfant
  const NeedsPopup = () => {
    if (!showNeedsPopup || !selectedMission) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClosePopup}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card max-w-md w-full rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-lg">Besoins spécifiques</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClosePopup}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {selectedMission.child.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-base">{selectedMission.child.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMission.child.age} ans</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedMission.child.needs?.map((need, index) => {
                  const needText = typeof need === 'string' ? need : need.type || need.description;
                  const needDescription = typeof need === 'string' ? need : need.description;
                  return (
                    <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-amber-700 dark:text-amber-400">{needText}</h5>
                          <p className="text-sm text-amber-600/80 dark:text-amber-300/80 mt-1">
                            {needText === 'TDAH' ? 
                              "Peut avoir besoin d'attention supplémentaire et de patience. Préfère un environnement calme." : 
                              needText === 'Allergie gluten' ?
                              "Ne doit pas consommer d'aliments contenant du gluten. Apporte généralement son propre repas." :
                              needDescription || "Peut manifester de l'anxiété lors des transitions. Prévoir un temps d'adaptation et rassurer l'enfant."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-5 flex justify-end">
                <Button variant="outline" onClick={handleClosePopup}>
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  // Composant pour afficher les détails de la mission avec carte Google Maps
  const DetailsPopup = () => {
    if (!showDetailsPopup || !selectedMission) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClosePopup}
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
              <Button variant="ghost" size="sm" onClick={handleClosePopup}>
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
                    <p className="text-sm text-muted-foreground">Chargement de l'itinéraire...</p>
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
              <Button variant="outline" onClick={handleClosePopup}>
                Fermer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  return (
    <>
      <Card className="rounded-lg bg-card text-card-foreground overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-secondary/10">
        <div className="flex flex-col space-y-1.5 p-6 pb-2">
          <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span>Missions à venir</span>
          </h3>
          <p className="text-sm text-muted-foreground">Aujourd&apos;hui · {upcomingMissions.length} missions planifiées</p>
        </div>
        
        <CardContent className="p-6 pt-0 pb-6">
          <div className="space-y-4">
            {upcomingMissions.map((mission, index) => (
            <Card 
              key={mission.id}
              className="rounded-lg text-card-foreground border-0 shadow-md bg-card overflow-hidden"
            >
              <div className="p-0">
                {/* Header avec informations de l'enfant */}
                <div className="bg-primary/5 border-b border-primary/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary shadow-md flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {mission.child.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{mission.child.name.split(' ')[0]}</h3>
                        <div className="inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[10px] font-medium px-2 py-0 h-5">
                          {index === 0 ? 'École → Loisirs' : 'Retour domicile'}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Départ prévu à {mission.scheduledTime || '00:00'}
                      </p>
                    </div>
                  </div>
                  
                </div>
                
                <div className="p-4">
                  {/* Itinéraire */}
                  <div className="bg-secondary/30 rounded-xl p-4 mb-4 relative overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center z-10">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                        <div className="w-0.5 h-14 bg-primary/20 my-1"></div>
                        <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center z-10">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-5">
                        <div>
                          <p className="text-sm font-medium">{mission.from.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{mission.from.address}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{mission.to.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{mission.to.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="text-xs font-medium whitespace-nowrap bg-primary hover:bg-primary/90 text-white"
                      onClick={() => handleShowDetails(mission)}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      Voir détails
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            className="text-xs font-medium whitespace-nowrap text-primary border-primary/20 hover:bg-primary/5"
            onClick={handleViewAllMissions}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Voir toutes les missions
          </Button>
        </div>
      </CardContent>
    </Card>
    
    {/* Rendu des popups */}
    <NeedsPopup />
    <DetailsPopup />
  </>
  );
}
