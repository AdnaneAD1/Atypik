'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, Navigation, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from '@/lib/auth/auth-context';
import { useTransport } from '@/hooks/use-transport';
import { useTracking } from '@/hooks/use-tracking';
import { Badge } from '@/components/ui/badge';

export function ParentTracking() {
  const { user } = useAuth();
  const { transportEvents, loadTransports } = useTransport();
  const { getActiveMissionByTransport, getMissionPosition, listenMissionByTransport } = useTracking();
  const [watchedMission, setWatchedMission] = useState<any | null>(null);
  const [watchedPosition, setWatchedPosition] = useState<{ lat: number; lng: number; timestamp: number } | null>(null);
  
  const [selectedTransportId, setSelectedTransportId] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Charger les transports au montage
  useEffect(() => {
    if (user?.id) {
      loadTransports();
    }
  }, [user?.id, loadTransports]);

  // Obtenir le transport sélectionné et sa mission active
  const selectedTransport = transportEvents?.find(t => t.id === selectedTransportId);
  const activeMission = selectedTransportId ? getActiveMissionByTransport(selectedTransportId) : null;
  const currentPosition = watchedPosition || (activeMission ? getMissionPosition(activeMission.id) : null);

  // S'abonner en temps réel à la mission liée au transport sélectionné (pour parents)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setWatchedMission(null);
    setWatchedPosition(null);
    if (selectedTransportId) {
      unsubscribe = listenMissionByTransport(selectedTransportId, (mission) => {
        setWatchedMission(mission || null);
        if (mission?.currentPosition) {
          setWatchedPosition({
            lat: mission.currentPosition.lat,
            lng: mission.currentPosition.lng,
            timestamp: mission.currentPosition.timestamp?.getTime?.() || new Date().getTime(),
          });
        } else {
          setWatchedPosition(null);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedTransportId, listenMissionByTransport]);

  // Initialiser Google Maps
  const initializeMap = () => {
    if (!mapRef.current || !window.google || !selectedTransport) return;

    const defaultCenter = {
      lat: selectedTransport.from.lat || 48.8566,
      lng: selectedTransport.from.lng || 2.3522
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
        position: { lat: selectedTransport.from.lat, lng: selectedTransport.from.lng },
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
        position: { lat: selectedTransport.to.lat, lng: selectedTransport.to.lng },
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
            origin: { lat: selectedTransport.from.lat, lng: selectedTransport.from.lng },
            destination: { lat: selectedTransport.to.lat, lng: selectedTransport.to.lng },
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

  // Mettre à jour la position du chauffeur
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition({
        lat: currentPosition.lat,
        lng: currentPosition.lng,
      });
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        position: { lat: currentPosition.lat, lng: currentPosition.lng },
        map: mapInstanceRef.current,
        title: 'Chauffeur',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#3B82F6"/>
              <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
        },
        animation: google.maps.Animation.BOUNCE,
      });

      // Centrer la carte sur la position du chauffeur
      mapInstanceRef.current.setCenter({
        lat: currentPosition.lat,
        lng: currentPosition.lng,
      });
    }
  }, [currentPosition]);

  // Initialiser la carte quand un transport est sélectionné
  useEffect(() => {
    if (selectedTransport && window.google) {
      // Réduire le délai pour un chargement plus rapide
      setTimeout(initializeMap, 50);
    }
  }, [selectedTransport]);

  // Précharger Google Maps si pas encore fait
  useEffect(() => {
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Filtrer les transports d'aujourd'hui (exclure les transports annulés)
  const todayTransports = transportEvents?.filter(transport => {
    const today = new Date();
    const transportDate = transport.date;
    return (
      transportDate.toDateString() === today.toDateString() &&
      transport.status !== 'cancelled' &&
      transport.status !== 'completed'
    );
  }) || [];
  const noTransports = todayTransports.length === 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Suivi en temps réel</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadTransports()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Sélection du transport */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un transport</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTransportId} onValueChange={setSelectedTransportId}>
            <SelectTrigger disabled={noTransports}>
              <SelectValue placeholder={noTransports ? "Aucun transport disponible" : "Choisissez un transport d'aujourd'hui"} />
            </SelectTrigger>
            <SelectContent>
              {noTransports ? (
                <SelectItem value="none" disabled>
                  Aucun transport disponible
                </SelectItem>
              ) : (
                todayTransports.map(transport => (
                  <SelectItem key={transport.id} value={transport.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{transport.childName} - {transport.time}</span>
                      <span className="text-xs text-muted-foreground">
                        {transport.from.address} → {transport.to.address}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTransport && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Carte en temps réel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Position en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg border"
                  style={{ minHeight: '384px' }}
                />
                {!isMapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 bg-white/90 p-4 rounded-lg shadow-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Initialisation...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Détails du trajet */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du trajet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Enfant</p>
                <p className="text-sm text-muted-foreground">{selectedTransport.childName}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Type de transport</p>
                <Badge variant="outline">{selectedTransport.transportType}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Heure prévue</p>
                <p className="text-sm text-muted-foreground">{selectedTransport.time}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Départ</p>
                <p className="text-sm text-muted-foreground">{selectedTransport.from.address}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Arrivée</p>
                <p className="text-sm text-muted-foreground">{selectedTransport.to.address}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Statut</p>
                {activeMission ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Navigation className="h-3 w-3 mr-1" />
                    En cours
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    En attente
                  </Badge>
                )}
              </div>

              {currentPosition && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Dernière position</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(currentPosition.timestamp).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Distance</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedTransport.distance / 1000).toFixed(2)} km
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedTransport && todayTransports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun transport aujourd&apos;hui</h3>
            <p className="text-muted-foreground text-center">
              Vous n&apos;avez aucun transport programmé pour aujourd&apos;hui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}