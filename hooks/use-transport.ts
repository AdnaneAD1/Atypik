import { useState, useCallback, useEffect } from 'react';
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
  distance: number; // en mètres (obligatoire, 0 par défaut)
  status: 'programmed' | 'in-progress' | 'completed' | 'cancelled'; // Statut du transport
};

// Type pour les données d'ajout de transport
export type AddTransportData = Omit<TransportEvent, 'id' | 'userId'>; // driverId est fourni par le parent

// Type pour les données de mise à jour de transport
export type UpdateTransportData = Omit<TransportEvent, 'id' | 'userId'>;

export function useTransport() {
  const { user } = useAuth();
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
          status: data.status || 'programmed', // Ajouter le statut avec fallback
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
    if (!data.driverId || data.driverId === "") {
      toast({
        title: 'Chauffeur requis',
        description: 'Vous devez sélectionner un chauffeur avant de programmer un transport.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const transportRef = collection(db, 'transports');
      // S'assurer que tous les champs obligatoires sont présents et valides
      console.log('Données reçues dans addTransport:', data);
      console.log('Distance reçue:', data.distance, typeof data.distance);
      
      const newTransport = {
        ...data,
        userId: user.id,
        driverId: data.driverId, // driverId fourni par le parent
        date: Timestamp.fromDate(data.date), // Convertir Date en Timestamp pour Firestore
        from: data.from,
        to: data.to,
        distance: data.distance ?? 0, // S'assurer que distance n'est jamais undefined
        status: 'programmed', // Statut par défaut
      };
      
      console.log('Transport à enregistrer dans Firestore:', newTransport);
      console.log('Distance finale:', newTransport.distance);

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
        driverId: data.driverId,
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
  }, [user?.id, toast, loadTransports]);

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

  // Ajouter une évaluation avec commentaire à un transport (dans la collection reviews)
  const addTransportComment = useCallback(async (transportId: string, rating: number, comment: string) => {
    if (!user?.id || !comment.trim() || rating < 1 || rating > 5) return false;

    setLoading(true);
    setError(null);

    try {
      // Trouver le transport pour récupérer le childId
      const transport = transportEvents.find(t => t.id === transportId);
      if (!transport) {
        throw new Error('Transport non trouvé');
      }

      // Créer un document de review dans la collection reviews
      const reviewsRef = collection(db, 'reviews');
      await addDoc(reviewsRef, {
        transportId,
        childId: transport.childId,
        userId: user.id,
        parentId: user.id,
        driverId: transport.driverId,
        comment: comment.trim(),
        rating: rating, // Note obligatoire
        createdAt: Timestamp.now(),
        type: 'given', // Le parent donne une évaluation
      });

      toast({
        title: 'Évaluation ajoutée',
        description: 'Votre évaluation a été enregistrée avec succès.',
      });

      return true;
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'évaluation:', err);
      setError('Impossible d\'ajouter l\'évaluation');
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'évaluation',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, transportEvents]);

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
    addTransportComment,
    getTransportsForDate,
    hasTransportsOnDate,
  };
}
