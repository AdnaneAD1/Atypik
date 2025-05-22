import { useState, useCallback, useEffect } from 'react';
import { useRegion } from './use-region';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';

// Type pour les événements de transport
export type TransportEvent = {
  id: string;
  childId: string;
  childName: string;
  date: Date;
  time: string;
  transportType: 'aller' | 'retour' | 'aller-retour';
  userId: string; // le parent qui crée
  driverId: string; // le chauffeur assigné
  from: {
    address: string;
    lat: number;
    lng: number;
    placeId?: string;
  };
  to: {
    address: string;
    lat: number;
    lng: number;
    placeId?: string;
  };
  distance?: number; // en mètres
};

// Type pour les données d'ajout de transport
export type AddTransportData = Omit<TransportEvent, 'id' | 'userId' | 'driverId'>; // driverId est déterminé automatiquement

// Type pour les données de mise à jour de transport
export type UpdateTransportData = Omit<TransportEvent, 'id' | 'userId'>;

export function useTransport() {
  const { user } = useAuth();
  const { userRegion } = useRegion();
  const { toast } = useToast();
  const [transportEvents, setTransportEvents] = useState<TransportEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les transports de l'utilisateur
  const loadTransports = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const transportRef = collection(db, 'transports');
      const q = query(transportRef, where('userId', '==', user.id));
      const querySnapshot = await getDocs(q);

      const transports: TransportEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transports.push({
          id: doc.id,
          childId: data.childId,
          childName: data.childName,
          date: data.date.toDate(), // Convertir Timestamp en Date
          time: data.time,
          transportType: data.transportType,
          userId: data.userId,
          driverId: data.driverId,
          from: data.from || { address: '', lat: 0, lng: 0 },
          to: data.to || { address: '', lat: 0, lng: 0 },
          distance: data.distance,
        });
      });

      setTransportEvents(transports.map(t => ({ ...t, driverId: t.driverId })));

    } catch (err) {
      console.error('Erreur lors du chargement des transports:', err);
      setError('Impossible de charger les transports');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les transports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Ajouter un nouveau transport
  const addTransport = useCallback(async (data: AddTransportData) => {
    if (!user?.id) return null;
    if (!userRegion?.driverId || userRegion.driverId === "") {
      toast({
        title: 'Aucun chauffeur disponible',
        description: 'Aucun chauffeur n\'est actuellement disponible dans votre région. Veuillez réessayer plus tard ou contacter l\'administration.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const transportRef = collection(db, 'transports');
      const newTransport = {
        ...data,
        userId: user.id,
        driverId: userRegion.driverId, // driverId déterminé automatiquement
        date: Timestamp.fromDate(data.date), // Convertir Date en Timestamp pour Firestore
        from: data.from,
        to: data.to,
        distance: data.distance,
      };

      const docRef = await addDoc(transportRef, newTransport);
      
      // Recharge la liste des transports depuis Firestore après ajout
      await loadTransports();
      toast({
        title: 'Transport programmé',
        description: `Transport ${data.transportType} ajouté pour ${data.childName}`,
      });
      return {
        ...data,
        id: docRef.id,
        userId: user.id,
        driverId: userRegion.driverId,
      };
    } catch (err) {
      console.error('Erreur lors de l\'ajout du transport:', err);
      setError('Impossible d\'ajouter le transport');
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le transport',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, userRegion, toast, loadTransports]);

  // Mettre à jour un transport existant
  const updateTransport = useCallback(async (id: string, data: UpdateTransportData) => {
    if (!user?.id) return false;

    setLoading(true);
    setError(null);

    try {
      const transportRef = doc(db, 'transports', id);
      await updateDoc(transportRef, {
        ...data,
        date: Timestamp.fromDate(data.date), // Convertir Date en Timestamp pour Firestore
      });

      // Mettre à jour l'état local
      setTransportEvents((prev) =>
        prev.map((transport) =>
          transport.id === id ? { ...transport, ...data } : transport
        )
      );

      toast({
        title: 'Transport mis à jour',
        description: `Les informations du transport ont été mises à jour`,
      });

      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du transport:', err);
      setError('Impossible de mettre à jour le transport');
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le transport',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Supprimer un transport
  const deleteTransport = useCallback(async (id: string) => {
    if (!user?.id) return false;

    setLoading(true);
    setError(null);

    try {
      const transportRef = doc(db, 'transports', id);
      await deleteDoc(transportRef);

      // Mettre à jour l'état local
      setTransportEvents((prev) => prev.filter((transport) => transport.id !== id));

      toast({
        title: 'Transport supprimé',
        description: 'Le transport a été supprimé avec succès',
      });

      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du transport:', err);
      setError('Impossible de supprimer le transport');
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le transport',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Obtenir les transports pour une date spécifique
  const getTransportsForDate = useCallback((date: Date) => {
    return transportEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [transportEvents]);

  // Vérifier si une date a des transports
  const hasTransportsOnDate = useCallback((date: Date) => {
    return transportEvents.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [transportEvents]);

  // Charger les transports au montage du composant
  useEffect(() => {
    if (user?.id) {
      loadTransports();
    }
  }, [user?.id, loadTransports]);

  return {
    transportEvents,
    loading,
    error,
    loadTransports,
    addTransport,
    updateTransport,
    deleteTransport,
    getTransportsForDate,
    hasTransportsOnDate,
  };
}
