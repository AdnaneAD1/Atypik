import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';
import { addDoc, collection, deleteDoc, doc, getDocs, getDoc, query, updateDoc, where, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { authFetch } from '@/lib/api/auth-fetch';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

// Type pour les positions GPS
export type GPSPosition = {
  id: string;
  driverId: string;
  missionId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number; // en km/h
  heading?: number; // direction en degrés
};

// Type pour les missions actives
export type ActiveMission = {
  id: string;
  driverId: string;
  transportId: string; // ID du transport programmé
  childName: string;
  from: {
    address: string;
    lat: number;
    lng: number;
  };
  to: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'started' | 'in_progress' | 'completed';
  startTime: Date;
  estimatedArrival?: Date;
  currentPosition?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
};

export function useTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeMissions, setActiveMissions] = useState<ActiveMission[]>([]);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const backgroundWatcherIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Utilitaire: distance en mètres (Haversine simplifié)
  const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000; // m
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  };

  // Démarrer une mission et commencer le tracking
  const startMission = useCallback(async (transportId: string, missionData: Omit<ActiveMission, 'id' | 'status' | 'startTime'>) => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);

    try {
      // Créer la mission active dans Firestore
      const activeMissionRef = collection(db, 'activeMissions');
      const newMission: Omit<ActiveMission, 'id'> = {
        ...missionData,
        status: 'started',
        startTime: new Date(),
      };

      const docRef = await addDoc(activeMissionRef, {
        ...newMission,
        startTime: serverTimestamp(),
      });

      // Mettre à jour le statut du transport lié -> 'in_progress'
      try {
        const transportRef = doc(db, 'transports', transportId);
        await updateDoc(transportRef, {
          status: 'in_progress',
        });
        // Best-effort: notify parent that the trip has started
        try {
          const transportSnap = await getDoc(transportRef);
          const tData = transportSnap.data() as any | undefined;
          const parentUserId = tData?.userId as string | undefined;
          const childName = tData?.childName as string | undefined;
          const fromAddr = tData?.from?.address as string | undefined;
          const toAddr = tData?.to?.address as string | undefined;
          if (parentUserId) {
            await authFetch('/api/notifications/send', {
              method: 'POST',
              body: JSON.stringify({
                userId: parentUserId,
                title: childName ? `Le trajet de ${childName} a démarré` : 'Trajet démarré',
                body: fromAddr && toAddr
                  ? `Le chauffeur a commencé le trajet: ${fromAddr} → ${toAddr}`
                  : 'Le chauffeur a commencé le trajet. Vous pouvez suivre le déplacement en direct.',
                data: {
                  type: 'transport',
                  transportId: transportId,
                  status: 'in_progress'
                },
              }),
            }).catch(() => {});
          }
        } catch (notifyErr) {
          console.warn('Notification startMission failed:', notifyErr);
        }
      } catch (e) {
        console.warn('Impossible de mettre à jour le statut du transport (start):', e);
      }

      // Réinitialiser le throttling au démarrage
      lastSentAtRef.current = 0;
      lastCoordsRef.current = null;

      const handlePositionUpdate = (lat: number, lng: number) => {
        const now = Date.now();
        const coords = { lat, lng };
        const last = lastCoordsRef.current;
        const elapsed = now - (lastSentAtRef.current || 0);
        const moved = last ? distanceMeters(last, coords) : Infinity;

        // Règles de throttling: au moins toutes les 3s ou si déplacement > 15m
        if (elapsed >= 3000 || moved >= 15) {
          lastSentAtRef.current = now;
          lastCoordsRef.current = coords;
          updateMissionPosition(docRef.id, {
            lat: coords.lat,
            lng: coords.lng,
            timestamp: new Date(),
          });
        }
      };

      // Démarrer la géolocalisation
      if (Capacitor.isNativePlatform()) {
        // Mode Natif Mobile Android : Foreground Service persistant avec notification active
        // Maintient le tracking GPS même si le chauffeur passe sur Waze, Google Maps ou éteint l'écran
        try {
          const watcherId = await BackgroundGeolocation.addWatcher(
            {
              backgroundTitle: 'Atypik Driver • Trajet en cours',
              backgroundMessage: missionData.childName
                ? `Position de ${missionData.childName} partagée en direct avec les parents`
                : 'Position partagée en direct avec les parents',
              requestPermissions: true,
              stale: false,
              distanceFilter: 10,
            },
            (location, error) => {
              if (error) {
                console.error('[BackgroundGeolocation] Erreur:', error);
                return;
              }
              if (location) {
                setCurrentPosition({
                  coords: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    altitude: location.altitude,
                    altitudeAccuracy: location.altitudeAccuracy,
                    heading: location.bearing,
                    speed: location.speed,
                  },
                  timestamp: location.time || Date.now(),
                } as any);

                handlePositionUpdate(location.latitude, location.longitude);
              }
            }
          );
          backgroundWatcherIdRef.current = watcherId;
          setIsTracking(true);
        } catch (bgErr) {
          console.error('[BackgroundGeolocation] Échec du démarrage en arrière-plan:', bgErr);
        }
      } else if (navigator.geolocation) {
        // Mode Navigateur Web standard (fallback de développement)
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentPosition(position);
            handlePositionUpdate(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error('Erreur de géolocalisation web:', error);
            toast({
              title: 'Erreur de géolocalisation',
              description: 'Impossible de suivre votre position',
              variant: 'destructive',
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );

        watchIdRef.current = watchId;
        setIsTracking(true);
      }

      toast({
        title: 'Mission démarrée',
        description: 'Le suivi GPS a commencé',
      });

      return {
        ...newMission,
        id: docRef.id,
      };
    } catch (err) {
      console.error('Erreur lors du démarrage de la mission:', err);
      setError('Impossible de démarrer la mission');
      toast({
        title: 'Erreur',
        description: 'Impossible de démarrer la mission',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Mettre à jour la position d'une mission
  const updateMissionPosition = useCallback(async (missionId: string, position: { lat: number; lng: number; timestamp: Date }) => {
    try {
      const missionRef = doc(db, 'activeMissions', missionId);
      await updateDoc(missionRef, {
        currentPosition: {
          ...position,
          timestamp: Timestamp.fromDate(position.timestamp),
        },
      });

      // Enregistrer la position dans l'historique GPS
      const gpsRef = collection(db, 'gpsPositions');
      await addDoc(gpsRef, {
        driverId: user?.id,
        missionId,
        lat: position.lat,
        lng: position.lng,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de position:', error);
    }
  }, [user?.id]);

  // Terminer une mission
  const completeMission = useCallback(async (missionId: string) => {
    if (!user?.id) return false;

    setLoading(true);
    try {
      const missionRef = doc(db, 'activeMissions', missionId);
      await updateDoc(missionRef, {
        status: 'completed',
        endTime: serverTimestamp(),
      });

      // Récupérer le transportId de la mission et mettre le transport à 'completed'
      try {
        const snap = await getDoc(missionRef);
        const data = snap.data() as Partial<ActiveMission> | undefined;
        const transportId = data?.transportId;
        if (transportId) {
          const transportRef = doc(db, 'transports', transportId);
          await updateDoc(transportRef, {
            status: 'completed',
          });
          // Best-effort: notify parent that the trip has completed
          try {
            const transportSnap = await getDoc(transportRef);
            const tData = transportSnap.data() as any | undefined;
            const parentUserId = tData?.userId as string | undefined;
            const childName = tData?.childName as string | undefined;
            if (parentUserId) {
              await authFetch('/api/notifications/send', {
                method: 'POST',
                body: JSON.stringify({
                  userId: parentUserId,
                  title: childName ? `Trajet terminé pour ${childName}` : 'Trajet terminé',
                  body: 'Le chauffeur a terminé le trajet. Merci pour votre confiance.',
                  data: {
                    type: 'transport',
                    transportId: transportId,
                    status: 'completed'
                  },
                }),
              }).catch(() => {});
            }
          } catch (notifyErr) {
            console.warn('Notification completeMission failed:', notifyErr);
          }
        }

        // Enregistrer le gain du chauffeur pour cette mission
        try {
          const gainsRef = collection(db, 'gains');
          await addDoc(gainsRef, {
            driverId: user.id,
            missionId,
            transportId: transportId || null,
            amount: 86, // montant fixe (~86€) selon hypothèse 3 courses/sem, mois de 30j
            currency: 'EUR',
            calculationMethod: 'fixed_estimate_3_per_week_30d',
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.warn('Impossible d\'enregistrer le gain:', e);
        }
      } catch (e) {
        console.warn('Impossible de mettre à jour le statut du transport (complete):', e);
      }

      // Arrêter la géolocalisation
      if (backgroundWatcherIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: backgroundWatcherIdRef.current }).catch(() => {});
        backgroundWatcherIdRef.current = null;
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);

      toast({
        title: 'Mission terminée',
        description: 'Le trajet a été complété avec succès',
      });

      return true;
    } catch (err) {
      console.error('Erreur lors de la finalisation de la mission:', err);
      setError('Impossible de terminer la mission');
      toast({
        title: 'Erreur',
        description: 'Impossible de terminer la mission',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Charger les missions actives
  const loadActiveMissions = useCallback(() => {
    if (!user?.id) return;

    const activeMissionsRef = collection(db, 'activeMissions');
    const q = query(
      activeMissionsRef,
      where('driverId', '==', user.id),
      where('status', 'in', ['started', 'in_progress'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missions: ActiveMission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        missions.push({
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          currentPosition: data.currentPosition ? {
            ...data.currentPosition,
            timestamp: data.currentPosition.timestamp?.toDate() || new Date(),
          } : undefined,
        } as ActiveMission);
      });
      setActiveMissions(missions);
    });

    unsubscribeRef.current = unsubscribe;
  }, [user?.id]);

  // Écoute ciblée par transportId (pour le parent)
  const listenMissionByTransport = useCallback((transportId: string, onChange: (mission?: ActiveMission) => void) => {
    if (!transportId) return () => {};
    const activeMissionsRef = collection(db, 'activeMissions');
    const q = query(
      activeMissionsRef,
      where('transportId', '==', transportId),
      where('status', 'in', ['started', 'in_progress'])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let mission: ActiveMission | undefined;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        mission = {
          id: docSnap.id,
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          currentPosition: data.currentPosition ? {
            ...data.currentPosition,
            timestamp: data.currentPosition.timestamp?.toDate() || new Date(),
          } : undefined,
        } as ActiveMission;
      });
      onChange(mission);
    });

    return unsub;
  }, []);

  // Obtenir les missions actives pour un parent (par transportId)
  const getActiveMissionByTransport = useCallback((transportId: string) => {
    return activeMissions.find(mission => mission.transportId === transportId);
  }, [activeMissions]);

  // Obtenir la position en temps réel d'une mission
  const getMissionPosition = useCallback((missionId: string) => {
    const mission = activeMissions.find(m => m.id === missionId);
    return mission?.currentPosition || null;
  }, [activeMissions]);

  // Nettoyer les listeners lors du démontage
  useEffect(() => {
    return () => {
      if (backgroundWatcherIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: backgroundWatcherIdRef.current }).catch(() => {});
        backgroundWatcherIdRef.current = null;
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Charger les missions actives au montage
  useEffect(() => {
    loadActiveMissions();
  }, [loadActiveMissions]);

  return {
    // État
    activeMissions,
    currentPosition,
    isTracking,
    loading,
    error,
    
    // Actions
    startMission,
    completeMission,
    updateMissionPosition,
    getActiveMissionByTransport,
    getMissionPosition,
    loadActiveMissions,
    listenMissionByTransport,
  };
}
