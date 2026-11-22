'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { LoaderDots } from '@/components/ui/loader';
import { useAuth } from '@/lib/auth/auth-context';
import { useTransport } from '@/hooks/use-transport';
import { useTracking } from '@/hooks/use-tracking';
import { useChildren } from '@/hooks/use-children';
import { cn } from '@/lib/utils';

export function ParentTracking() {
  const { user } = useAuth();
  const { transportEvents, loadTransports } = useTransport();
  const { children: childrenProfiles } = useChildren();
  const { getActiveMissionByTransport, getMissionPosition, listenMissionByTransport } = useTracking();
  const [watchedMission, setWatchedMission] = useState<any | null>(null);
  const [watchedPosition, setWatchedPosition] = useState<{ lat: number; lng: number; timestamp: number } | null>(null);
  
  const [selectedTransportId, setSelectedTransportId] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Charger les transports au montage
  const refresh = () => {
    loadTransports();
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          setLastUpdated(new Date());
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
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !selectedTransport) return;

    const defaultCenter = {
      lat: selectedTransport.from.lat || 48.8566,
      lng: selectedTransport.from.lng || 2.3522
    };

    try {
      // Réinitialiser le marqueur chauffeur lors d'un changement de carte
      driverMarkerRef.current = null;
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
            strokeColor: '#fcb50d',
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
  }, [selectedTransport]);

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
              <circle cx="12" cy="12" r="10" fill="#fcb50d"/>
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
  }, [selectedTransport, initializeMap]);

  // Précharger Google Maps si pas encore fait
  useEffect(() => {
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (selectedTransport) {
          setTimeout(initializeMap, 50);
        }
      };
      document.head.appendChild(script);
    }
  }, [selectedTransport, initializeMap]);

  // Filtrer les transports d'aujourd'hui (exclure les transports annulés)
  const todayTransports = useMemo(() => transportEvents?.filter(transport => {
    const today = new Date();
    const transportDate = transport.date;
    return (
      transportDate.toDateString() === today.toDateString() &&
      transport.status !== 'cancelled' &&
      transport.status !== 'completed'
    );
  }) || [], [transportEvents]);
  const noTransports = todayTransports.length === 0;

  // Sélectionner automatiquement le premier transport du jour s'il n'y en a pas de sélectionné
  useEffect(() => {
    if (todayTransports.length > 0 && !selectedTransportId) {
      setSelectedTransportId(todayTransports[0].id);
    }
  }, [todayTransports, selectedTransportId]);

  const isEnRoute = !!(watchedMission || activeMission);
  const stepIndex = isEnRoute ? 1 : 0; // 0 = En attente, 1 = En route, 2 = Arrivé
  const STEPS = ['En attente', 'En route', 'Arrivé'];
  const AVATAR_TINTS = [
    'bg-brand-yellow text-slate-900',
    'bg-brand-teal text-white',
    'bg-primary text-white',
    'bg-brand-pink text-white',
  ];
  const shortAddr = (addr?: string) => (addr || '').split(',')[0];
  const firstName = (selectedTransport?.childName || '').split(' ')[0];
  const childPhoto = (name?: string) =>
    childrenProfiles.find((c: any) => c.name === name)?.avatar || undefined;
  const childInitials = (name?: string) =>
    (name || 'E').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* En-tête */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Suivi en temps réel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Position de votre enfant en direct
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {lastUpdated && (
            <span className="hidden text-xs text-muted-foreground sm:inline" aria-live="polite">
              Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            className="h-10 bg-primary px-4 font-bold text-white hover:bg-primary/90 sm:h-12 sm:px-5"
            onClick={refresh}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Sélection du transport — pilules enfant */}
      {todayTransports.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3" role="radiogroup" aria-label="Choisir un transport">
          {todayTransports.map((transport, index) => {
            const selected = transport.id === selectedTransportId;
            const photo = childPhoto(transport.childName);
            return (
              <button
                key={transport.id}
                onClick={() => setSelectedTransportId(transport.id)}
                aria-pressed={selected}
                className={cn(
                  'flex min-w-0 items-center gap-2.5 rounded-full py-2 pl-2 pr-3 text-left transition-colors sm:gap-3 sm:pr-5',
                  selected
                    ? 'bg-primary text-white'
                    : 'bg-white text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold sm:h-11 sm:w-11 sm:text-sm',
                  !photo && AVATAR_TINTS[index % AVATAR_TINTS.length]
                )}>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    childInitials(transport.childName)
                  )}
                </span>
                <span className="min-w-0">
                  <span className={cn('block truncate text-sm font-bold', selected ? 'text-white' : 'text-slate-900')}>
                    {transport.childName}, {transport.time}
                  </span>
                  <span className={cn('block truncate text-xs', selected ? 'text-white/75' : 'text-muted-foreground')}>
                    {shortAddr(transport.from?.address)} vers {shortAddr(transport.to?.address)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedTransport ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Carte — fond clair pendant le chargement */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[6px_28px_6px_28px] bg-slate-100 sm:aspect-[800/560]">
            <div ref={mapRef} className="absolute inset-0" />
            {!isMapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <LoaderDots large />
                  <p className="text-sm text-slate-500">Initialisation...</p>
                </div>
              </div>
            )}
            <span className={cn(
              'absolute left-5 top-5 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold',
              isEnRoute ? 'bg-emerald-400 text-slate-900' : 'bg-primary text-white'
            )}>
              <span className={cn('h-2.5 w-2.5 rounded-full', isEnRoute ? 'bg-slate-900' : 'bg-white')} />
              {isEnRoute ? 'En route' : 'En attente'}
            </span>
            <span className="absolute bottom-4 right-4 rounded-md bg-slate-900 px-3.5 py-1.5 font-brand text-base font-bold text-white">
              {(selectedTransport.distance / 1000).toFixed(2).replace('.', ',')} km
            </span>
            <span className="absolute bottom-4 left-5 rounded bg-white/85 px-2 py-0.5 text-sm font-medium text-slate-700">
              Itinéraire prévu
            </span>
          </div>

          {/* Panneau info — carte claire à liseré jaune */}
          <div className="rounded-[6px_28px_6px_28px] bg-white p-6 shadow-sm sm:p-7">
            <h2 className="font-brand text-2xl font-bold leading-tight text-slate-900">
              {isEnRoute
                ? `${firstName} est en route.`
                : `${firstName} n'est pas encore parti.`}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isEnRoute
                ? 'Sa position est mise à jour en temps réel.'
                : "Le transport n'a pas commencé. Sa position apparaîtra ici dès le départ."}
            </p>

            {/* Étapes — filets comme la référence */}
            <ol className="mt-6 grid grid-cols-3 gap-1.5">
              {STEPS.map((step, i) => (
                <li
                  key={step}
                  aria-current={i === stepIndex ? 'step' : undefined}
                  className={cn(
                    'border-t-[6px] pt-2.5 text-sm',
                    i === stepIndex
                      ? 'border-primary font-bold text-slate-900'
                      : 'border-slate-200 text-muted-foreground'
                  )}
                >
                  {step}
                </li>
              ))}
            </ol>

            {/* Heure */}
            <div className="mt-7 flex items-baseline gap-3.5">
              <span className="font-brand text-6xl font-bold leading-none tracking-tight text-slate-900">
                {selectedTransport.time}
              </span>
              <span className="text-sm text-muted-foreground">
                {isEnRoute ? 'Heure de départ' : 'Heure prévue'}
              </span>
            </div>

            {/* Itinéraire — pointillés + points vert/corail */}
            <ul className="relative mt-6 space-y-5">
              <span className="absolute bottom-7 left-[7px] top-3.5 w-0 border-l-2 border-dotted border-slate-300" aria-hidden="true" />
              <li className="relative pl-8">
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-emerald-600" />
                <p className="truncate text-sm font-bold text-slate-900">
                  {shortAddr(selectedTransport.from?.address) || 'Départ'}
                </p>
                <p className="mt-0.5 break-words text-xs text-muted-foreground">
                  {selectedTransport.from?.address}
                </p>
              </li>
              <li className="relative pl-8">
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-primary" />
                <p className="truncate text-sm font-bold text-slate-900">
                  {shortAddr(selectedTransport.to?.address) || 'Arrivée'}
                </p>
                <p className="mt-0.5 break-words text-xs text-muted-foreground">
                  {selectedTransport.to?.address}
                </p>
              </li>
            </ul>

            {/* Faits — grille dt/dd comme la référence */}
            <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-200 pt-6">
              <div>
                <dt className="text-sm text-muted-foreground">Enfant</dt>
                <dd className="mt-0.5 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[10px] font-bold text-slate-900">
                    {childPhoto(selectedTransport.childName) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={childPhoto(selectedTransport.childName)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      childInitials(selectedTransport.childName)
                    )}
                  </span>
                  <span className="truncate text-base font-bold text-slate-900">{selectedTransport.childName}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Type</dt>
                <dd className="mt-1">
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
                    {selectedTransport.transportType === 'aller-retour' ? 'Aller-retour'
                      : selectedTransport.transportType === 'aller' ? 'Aller' : 'Retour'}
                  </span>
                </dd>
              </div>
              {selectedTransport.motif && selectedTransport.motif.trim() !== '' && (
                <div>
                  <dt className="text-sm text-muted-foreground">Motif</dt>
                  <dd className="mt-0.5 break-words text-base font-bold text-slate-900">{selectedTransport.motif}</dd>
                </div>
              )}
              {typeof (selectedTransport as any).waitingTime === 'number' && (
                <div>
                  <dt className="text-sm text-muted-foreground">Temps d&apos;attente</dt>
                  <dd className="mt-0.5 text-base font-bold text-slate-900">{(selectedTransport as any).waitingTime} min</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-muted-foreground">Distance</dt>
                <dd className="mt-0.5 text-base font-bold text-slate-900">
                  {(selectedTransport.distance / 1000).toFixed(2).replace('.', ',')} km
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <Card className="rounded-xl border shadow-none">
          <CardContent className="flex flex-col items-center gap-5 py-10 text-center sm:flex-row sm:text-left">
            <div className="h-28 w-[102px] shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
            </div>
            <div>
              <p className="text-sm font-medium">Aucun transport aujourd&apos;hui</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vous n&apos;avez aucun transport programmé pour aujourd&apos;hui.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
