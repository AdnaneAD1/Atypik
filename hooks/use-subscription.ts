'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';

export interface Subscription {
  id: string;
  userId: string;
  type: 'standard' | 'premium';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Timestamp;
  endDate?: Timestamp;
  price: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubscriptionHook {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  canCreateTransport: boolean;
  weeklyTransportCount: number;
  loadSubscription: () => Promise<void>;
  createSubscription: (type: 'standard' | 'premium') => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

export function useSubscription(): SubscriptionHook {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyTransportCount, setWeeklyTransportCount] = useState(0);
  const { user } = useAuth();

  // Charger l'abonnement de l'utilisateur
  const loadSubscription = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', user.id));
      
      if (subscriptionDoc.exists()) {
        const data = subscriptionDoc.data();
        setSubscription({
          id: subscriptionDoc.id,
          ...data
        } as Subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'abonnement:', err);
      setError('Erreur lors du chargement de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouvel abonnement
  const createSubscription = async (type: 'standard' | 'premium') => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const now = Timestamp.now();
      const price = type === 'standard' ? 149 : 189;
      
      // Pour tous les abonnements, calculer la date de fin (30 jours)
      const endDateMs = now.toMillis() + (30 * 24 * 60 * 60 * 1000); // 30 jours
      const endDate = Timestamp.fromMillis(endDateMs);

      const newSubscription = {
        userId: user.id,
        type,
        status: 'active',
        startDate: now,
        endDate: endDate,
        price,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(db, 'subscriptions', user.id), newSubscription);
      
      // Recharger l'abonnement
      await loadSubscription();
    } catch (err) {
      console.error('Erreur lors de la création de l\'abonnement:', err);
      setError('Erreur lors de la création de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  // Annuler l'abonnement
  const cancelSubscription = async () => {
    if (!user?.id || !subscription) return;

    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'subscriptions', user.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });

      await loadSubscription();
    } catch (err) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', err);
      setError('Erreur lors de l\'annulation de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur a un abonnement actif
  const hasActiveSubscription = (): boolean => {
    if (!subscription) return false;
    
    if (subscription.status !== 'active') return false;

    // Pour tous les abonnements, vérifier la date d'expiration
    if (subscription.endDate) {
      const now = new Date();
      const endDate = subscription.endDate.toDate();
      return now <= endDate;
    }

    // Si pas de date de fin, considérer comme actif
    return true;
  };

  // Compter les transports de la semaine courante
  const loadWeeklyTransportCount = async () => {
    if (!user?.id) {
      setWeeklyTransportCount(0);
      return;
    }

    try {
      // Calculer le début et la fin de la semaine courante
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Dimanche
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Samedi
      endOfWeek.setHours(23, 59, 59, 999);

      // Requête pour compter les transports de cette semaine
      const transportsQuery = query(
        collection(db, 'transports'),
        where('userId', '==', user.id),
        where('date', '>=', Timestamp.fromDate(startOfWeek)),
        where('date', '<=', Timestamp.fromDate(endOfWeek)),
        where('status', '!=', 'cancelled') // Exclure les transports annulés
      );

      const querySnapshot = await getDocs(transportsQuery);
      setWeeklyTransportCount(querySnapshot.size);
    } catch (err) {
      console.error('Erreur lors du comptage des transports hebdomadaires:', err);
      setWeeklyTransportCount(0);
    }
  };

  // Vérifier si l'utilisateur peut créer un transport
  const canCreateTransport = (): boolean => {
    if (!hasActiveSubscription()) return false;
    if (!subscription) return false;

    // Pour l'abonnement Premium, pas de limite
    if (subscription.type === 'premium') return true;

    // Pour l'abonnement Standard, vérifier la limite de 2 transports/semaine
    if (subscription.type === 'standard') {
      return weeklyTransportCount < 2;
    }

    return false;
  };

  // Charger l'abonnement et le compteur de transports au montage du composant
  useEffect(() => {
    if (user?.id) {
      loadSubscription();
      loadWeeklyTransportCount();
    }
  }, [user?.id]);

  return {
    subscription,
    loading,
    error,
    hasActiveSubscription: hasActiveSubscription(),
    canCreateTransport: canCreateTransport(),
    weeklyTransportCount,
    loadSubscription,
    createSubscription,
    cancelSubscription
  };
}
