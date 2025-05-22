import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';

// Type pour les événements de transport chauffeur
export type DriverTransportEvent = {
  id: string;
  childId: string;
  childName: string;
  date: Date;
  time: string;
  transportType: 'aller' | 'retour' | 'aller-retour';
  userId: string; // parent
  driverId: string; // chauffeur
  from?: string;
  to?: string;
};

export function useDriversTransport(driverId: string | undefined) {
  const { toast } = useToast();
  const [transports, setTransports] = useState<DriverTransportEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les transports du chauffeur
  const loadTransports = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      const transportRef = collection(db, 'transports');
      const q = query(transportRef, where('driverId', '==', driverId));
      const querySnapshot = await getDocs(q);
      const results: DriverTransportEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          childId: data.childId,
          childName: data.childName,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          time: data.time,
          transportType: data.transportType,
          userId: data.userId,
          driverId: data.driverId,
          from: data.from,
          to: data.to,
        });
      });
      setTransports(results);
    } catch (err) {
      setError('Impossible de charger les transports');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les transports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [driverId, toast]);

  // Obtenir les transports pour une date donnée
  const getTransportsForDate = useCallback((date: Date) => {
    return transports.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [transports]);

  // Vérifier si une date a des transports
  const hasTransportsOnDate = useCallback((date: Date) => {
    return transports.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [transports]);

  useEffect(() => {
    if (driverId) {
      loadTransports();
    }
  }, [driverId, loadTransports]);

  return {
    transports,
    loading,
    error,
    loadTransports,
    getTransportsForDate,
    hasTransportsOnDate,
  };
}
