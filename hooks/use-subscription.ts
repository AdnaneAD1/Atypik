'use client';

import { useState, useEffect, useCallback } from 'react';
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
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { authFetch } from '@/lib/api/auth-fetch';

function toDateSafe(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === 'function') {
    const d = val.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  if (typeof val._seconds === 'number') {
    return new Date(val._seconds * 1000);
  }
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeSubscriptionDoc(id: string, data: Record<string, any>): Subscription {
  const endDateObj = toDateSafe(data.endDate);
  const isExpiredByDate = endDateObj ? new Date() > endDateObj : false;
  const effectiveStatus: Subscription['status'] =
    data.status === 'active' && isExpiredByDate ? 'expired' : data.status || 'expired';

  return {
    id,
    ...data,
    status: effectiveStatus,
  } as Subscription;
}

export interface Subscription {
  id: string;
  userId: string;
  type: 'standard' | 'premium';
  status: 'active' | 'expired' | 'cancelled';
  autoRenew?: boolean;
  paypalSubscriptionId?: string;
  paypalOrderId?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  nextBillingDate?: Timestamp;
  price: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateSubscriptionDetails {
  paypalOrderId?: string;
  paypalSubscriptionId?: string;
  payerEmail?: string;
  autoRenew?: boolean;
}

export interface SubscriptionHook {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  canCreateTransport: boolean;
  weeklyTransportCount: number;
  getWeeklyTransportCountForDate: (targetDate?: Date) => number;
  canCreateTransportForDate: (targetDate?: Date) => boolean;
  loadSubscription: () => Promise<void>;
  createSubscription: (
    type: 'standard' | 'premium',
    details?: CreateSubscriptionDetails
  ) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

/**
 * Calcule le lundi 00:00:00 et le dimanche 23:59:59 de la semaine contenant `refDate`
 */
function getWeekBounds(refDate: Date = new Date()): { startOfWeek: Date; endOfWeek: Date } {
  const d = new Date(refDate);
  const day = d.getDay(); // 0 = Dimanche, 1 = Lundi, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

export function useSubscription(): SubscriptionHook {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userTransports, setUserTransports] = useState<Array<{ date: Date; status: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Charger l'abonnement de l'utilisateur manuellement si besoin
  const loadSubscription = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', user.id));

      if (subscriptionDoc.exists()) {
        const data = subscriptionDoc.data();
        setSubscription(normalizeSubscriptionDoc(subscriptionDoc.id, data));
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'abonnement:", err);
      setError("Erreur lors du chargement de l'abonnement");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Compter les transports actifs pour la semaine d'une date donnée
  const getWeeklyTransportCountForDate = useCallback(
    (targetDate: Date = new Date()): number => {
      const { startOfWeek, endOfWeek } = getWeekBounds(targetDate);
      return userTransports.filter((t) => {
        if (t.status === 'cancelled') return false;
        return t.date >= startOfWeek && t.date <= endOfWeek;
      }).length;
    },
    [userTransports]
  );

  const weeklyTransportCount = getWeeklyTransportCountForDate(new Date());

  // Créer ou renouveler un abonnement (avec sauvegarde serveur + fallback Firestore)
  const createSubscription = async (
    type: 'standard' | 'premium',
    details?: CreateSubscriptionDetails
  ) => {
    if (!user?.id) {
      throw new Error('Utilisateur non authentifié');
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/paypal/subscription', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          type,
          paypalOrderId: details?.paypalOrderId,
          paypalSubscriptionId: details?.paypalSubscriptionId,
          payerEmail: details?.payerEmail,
          autoRenew: details?.autoRenew ?? true,
        }),
      });

      if (!res.ok) {
        // Fallback client-side au cas où l'API serveur ne répond pas (mode hors-ligne / dev)
        const now = Timestamp.now();
        const price = type === 'standard' ? 149 : 189;
        const endDateMs = now.toMillis() + 30 * 24 * 60 * 60 * 1000;
        const endDate = Timestamp.fromMillis(endDateMs);

        const newSubscription: Record<string, any> = {
          userId: user.id,
          type,
          status: 'active',
          autoRenew: details?.autoRenew ?? true,
          startDate: now,
          endDate,
          nextBillingDate: endDate,
          price,
          createdAt: now,
          updatedAt: now,
        };

        if (details?.paypalSubscriptionId) {
          newSubscription.paypalSubscriptionId = details.paypalSubscriptionId;
        }
        if (details?.paypalOrderId) {
          newSubscription.paypalOrderId = details.paypalOrderId;
        }

        await setDoc(doc(db, 'subscriptions', user.id), newSubscription, { merge: true });
      }

      await loadSubscription();
    } catch (err: any) {
      console.error("Erreur lors de la création de l'abonnement:", err);
      setError("Erreur lors de la création de l'abonnement");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Annuler le renouvellement automatique de l'abonnement (conserve l'accès jusqu'à endDate)
  const cancelSubscription = async () => {
    if (!user?.id || !subscription) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/paypal/subscription', {
        method: 'DELETE',
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) {
        const endDateObj = toDateSafe(subscription.endDate);
        const stillValid = endDateObj ? endDateObj.getTime() > Date.now() : false;

        await updateDoc(doc(db, 'subscriptions', user.id), {
          autoRenew: false,
          status: stillValid ? 'active' : 'cancelled',
          updatedAt: serverTimestamp(),
        });
      }

      await loadSubscription();
    } catch (err: any) {
      console.error("Erreur lors de l'annulation de l'abonnement:", err);
      setError("Erreur lors de l'annulation de l'abonnement");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur a un abonnement actif et non expiré
  const checkHasActiveSubscription = useCallback((): boolean => {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;

    const endDate = toDateSafe(subscription.endDate);
    if (endDate) {
      return new Date() <= endDate;
    }

    return true;
  }, [subscription]);

  const hasActiveSubscription = checkHasActiveSubscription();

  // Vérifier si l'utilisateur peut créer un transport pour une date donnée
  const canCreateTransportForDate = useCallback(
    (targetDate: Date = new Date()): boolean => {
      if (!hasActiveSubscription || !subscription) return false;

      if (subscription.type === 'premium') return true;

      if (subscription.type === 'standard') {
        const countForTargetWeek = getWeeklyTransportCountForDate(targetDate);
        return countForTargetWeek < 2;
      }

      return false;
    },
    [hasActiveSubscription, subscription, getWeeklyTransportCountForDate]
  );

  const canCreateTransport = canCreateTransportForDate(new Date());

  // Écoute temps réel de l'abonnement et des transports de l'utilisateur
  // (Évite l'erreur d'index composite Firestore et met à jour le quota immédiatement après ajout/annulation)
  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      setUserTransports([]);
      return;
    }

    setLoading(true);

    const subRef = doc(db, 'subscriptions', user.id);
    const unsubSubscription = onSnapshot(
      subRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSubscription(normalizeSubscriptionDoc(docSnap.id, docSnap.data()));
        } else {
          setSubscription(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Erreur listener abonnement:', err);
        setLoading(false);
      }
    );

    const transportsQuery = query(
      collection(db, 'transports'),
      where('userId', '==', user.id)
    );
    const unsubTransports = onSnapshot(
      transportsQuery,
      (querySnap) => {
        const items: Array<{ date: Date; status: string }> = [];
        querySnap.forEach((docItem) => {
          const data = docItem.data();
          const rawDate = data.date;
          const parsedDate =
            rawDate && typeof rawDate.toDate === 'function'
              ? rawDate.toDate()
              : rawDate instanceof Date
              ? rawDate
              : new Date(rawDate);
          items.push({
            date: parsedDate,
            status: data.status || 'programmed',
          });
        });
        setUserTransports(items);
      },
      (err) => {
        console.error('Erreur listener transports quota:', err);
      }
    );

    return () => {
      unsubSubscription();
      unsubTransports();
    };
  }, [user?.id]);

  return {
    subscription,
    loading,
    error,
    hasActiveSubscription,
    canCreateTransport,
    weeklyTransportCount,
    getWeeklyTransportCountForDate,
    canCreateTransportForDate,
    loadSubscription,
    createSubscription,
    cancelSubscription,
  };
}
