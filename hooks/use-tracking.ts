import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';
import { addDoc, collection, deleteDoc, doc, getDocs, getDoc, query, updateDoc, where, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';

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
      } catch (e) {
        console.warn('Impossible de mettre à jour le statut du transport (start):', e);
      }

      // Démarrer la géolocalisation
      if (navigator.geolocation) {
        // Réinitialiser le throttling au démarrage
        lastSentAtRef.current = 0;
        lastCoordsRef.current = null;

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentPosition(position);

            const now = Date.now();
            const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
            const last = lastCoordsRef.current;
            const elapsed = now - (lastSentAtRef.current || 0);
            const moved = last ? distanceMeters(last, coords) : Infinity;

            // Règles de throttling: au moins toutes les 3s ou si déplacement > 25m
            if (elapsed >= 3000 || moved >= 25) {
              lastSentAtRef.current = now;
              lastCoordsRef.current = coords;
              updateMissionPosition(docRef.id, {
                lat: coords.lat,
                lng: coords.lng,
                timestamp: new Date(),
              });
            }
          },
          (error) => {
            console.error('Erreur de géolocalisation:', error);
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
        }
      } catch (e) {
        console.warn('Impossible de mettre à jour le statut du transport (complete):', e);
      }

      // Arrêter la géolocalisation
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsTracking(false);
      }

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
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
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
