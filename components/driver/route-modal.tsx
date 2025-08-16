'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Navigation, MapPin, Clock, User, Car, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Mission {
  id: string;
  child: {
    name: string;
    age: number;
  };
  parent: {
    name: string;
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

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
}

export function RouteModal({ isOpen, onClose, mission }: RouteModalProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Nettoyer la carte quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setIsMapLoaded(false);
      setMapError(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      routeRendererRef.current = null;
    }
  }, [isOpen]);

  // Initialiser la carte Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !mission || !window.google) return;

    console.log('🗺️ Initialisation de la carte avec mission:', {
      mission,
      fromCoords: { lat: mission.from.lat, lng: mission.from.lng },
      toCoords: { lat: mission.to.lat, lng: mission.to.lng },
      hasFromCoords: mission.from.lat !== undefined && mission.from.lng !== undefined,
      hasToCoords: mission.to.lat !== undefined && mission.to.lng !== undefined
    });

    // Vérifier si nous avons les coordonnées ou les adresses
    if ((!mission.from.lat || !mission.from.lng) && !mission.from.address) {
      console.error('❌ Ni coordonnées ni adresse de départ disponibles');
      setMapError(true);
      setIsMapLoaded(true);
      return;
    }
    
    if ((!mission.to.lat || !mission.to.lng) && !mission.to.address) {
      console.error('❌ Ni coordonnées ni adresse d\'arrivée disponibles');
      setMapError(true);
      setIsMapLoaded(true);
      return;
    }

    setIsMapLoaded(false);
    setMapError(false);

    try {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { 
          lat: mission.from.lat || 48.8566, 
          lng: mission.from.lng || 2.3522 
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });

      // Marquer comme chargé d'abord
      setIsMapLoaded(true);

      // Calculer et afficher l'itinéraire avec géocodage si nécessaire
      setTimeout(() => {
        console.log('🚗 Calcul de l\'itinéraire avec géocodage...');
        
        const directionsService = new google.maps.DirectionsService();
        routeRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: false, // Laisser Google Maps gérer les marqueurs
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4,
          },
        });
        routeRendererRef.current.setMap(mapInstanceRef.current);

        // Utiliser les adresses directement pour le géocodage automatique
        const origin = mission.from.lat && mission.from.lng 
          ? { lat: mission.from.lat, lng: mission.from.lng }
          : mission.from.address;
          
        const destination = mission.to.lat && mission.to.lng 
          ? { lat: mission.to.lat, lng: mission.to.lng }
          : mission.to.address;
        
        console.log('📍 Requête d\'itinéraire avec géocodage:', { origin, destination });

        directionsService.route(
          {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            console.log('📊 Réponse DirectionsService:', { status, result });
            
            if (status === 'OK' && routeRendererRef.current && result && result.routes && result.routes[0]) {
              console.log('✅ Itinéraire affiché avec succès!');
              routeRendererRef.current.setDirections(result);
              
              // Ajuster la vue pour inclure tout l'itinéraire
              if (mapInstanceRef.current && result.routes[0]) {
                const bounds = result.routes[0].bounds;
                if (bounds) {
                  mapInstanceRef.current.fitBounds(bounds, 50);
                }
              }
            } else {
              console.error('❌ Erreur lors du calcul de l\'itinéraire:', status);
              setMapError(true);
            }
          }
        );
      }, 500);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      setMapError(true);
      setIsMapLoaded(true);
    }
  }, [mission]);

  // Charger Google Maps si nécessaire et initialiser la carte
  useEffect(() => {
    if (!isOpen || !mission) return;

    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps) {
        // Google Maps déjà chargé
        setTimeout(initializeMap, 100);
        return;
      }

      // Charger Google Maps
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(initializeMap, 100);
        };
        script.onerror = () => {
          console.error('Erreur lors du chargement de Google Maps');
          setMapError(true);
          setIsMapLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        // Script déjà présent, attendre qu'il se charge
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            setTimeout(initializeMap, 100);
          }
        }, 100);

        // Timeout après 10 secondes
        setTimeout(() => {
          clearInterval(checkGoogleMaps);
          if (!window.google) {
            setMapError(true);
            setIsMapLoaded(true);
          }
        }, 10000);
      }
    };

    loadGoogleMaps();
  }, [isOpen, mission, initializeMap]);

  if (!isOpen || !mission) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                <Navigation className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Itinéraire de mission</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{mission.child.name}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{mission.scheduledTime}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Informations du trajet */}
          <div className="p-4 border-b bg-muted/30 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-700">Point de départ</p>
                  <p className="text-xs text-muted-foreground break-words">{mission.from.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-700">Destination</p>
                  <p className="text-xs text-muted-foreground break-words">{mission.to.address}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                <Car className="h-3 w-3 mr-1" />
                {mission.distance?.toFixed(1) || '0.0'} km
              </Badge>
              <Badge variant="outline" className="text-xs">
                {
                  mission.transportType === 'aller-retour'
                    ? 'Aller-Retour'
                    : mission.transportType === 'aller'
                    ? 'Aller'
                    : 'Retour'
                }
              </Badge>
              <Badge variant="outline" className="text-xs">
                Parent: {mission.parent.name}
              </Badge>
            </div>
          </div>

          {/* Carte Google Maps */}
          <div className="flex-1 relative overflow-hidden">
            {(!isMapLoaded || mapError) && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="flex flex-col items-center gap-3 bg-card p-6 rounded-lg shadow-lg border">
                  {mapError ? (
                    <>
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Impossible de charger la carte</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vérifiez votre connexion internet
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={initializeMap}>
                        Réessayer
                      </Button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Chargement de la carte...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Calcul de l&apos;itinéraire en cours
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div 
              ref={mapRef} 
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/30 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Itinéraire optimisé par Google Maps</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
