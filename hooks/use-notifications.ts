'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, generateToken, onMessageListener } from '@/firebase/ClientApp';
import { 
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';

export interface NotificationSettings {
  id: string;
  userId: string;
  fcmToken: string | null;
  isEnabled: boolean;
  permissions: {
    browser: boolean;
    transport: boolean;
    messages: boolean;
    general: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationHook {
  settings: NotificationSettings | null;
  loading: boolean;
  error: string | null;
  isSupported: boolean;
  hasPermission: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  updatePermissions: (permissions: Partial<NotificationSettings['permissions']>) => Promise<void>;
  refreshToken: () => Promise<void>;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp;
  type?: string;
  data?: Record<string, any>;
}

export function useNotifications(): NotificationHook {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();

  // Vérifier le support des notifications
  useEffect(() => {
    const checkSupport = () => {
      try {
        const supported = 'serviceWorker' in navigator && 'Notification' in window;
        setIsSupported(supported);
        
        if (supported) {
          const permission = Notification.permission;
          setHasPermission(permission === 'granted');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du support:', error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Charger les paramètres de notification
  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const settingsDoc = await getDoc(doc(db, 'notificationSettings', user.id));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({
          id: settingsDoc.id,
          ...data
        } as NotificationSettings);
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres de notification:', err);
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Activer les notifications
  const enableNotifications = async (): Promise<boolean> => {
    if (!user?.id || !isSupported) return false;

    setLoading(true);
    setError(null);

    try {
      // Obtenir le token FCM via helper sécurisé (client-only)
      const token = await generateToken();
      
      if (!token) {
        setError('Impossible d\'obtenir le token FCM');
        return false;
      }

      setHasPermission(true);

      // Sauvegarder les paramètres
      const notificationSettings: NotificationSettings = {
        id: user.id,
        userId: user.id,
        fcmToken: token,
        isEnabled: true,
        permissions: {
          browser: true,
          transport: true,
          messages: true,
          general: true
        },
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(doc(db, 'notificationSettings', user.id), notificationSettings);
      await loadSettings();

      return true;
    } catch (err) {
      console.error('Erreur lors de l\'activation des notifications:', err);
      setError('Erreur lors de l\'activation des notifications');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Désactiver les notifications
  const disableNotifications = async (): Promise<void> => {
    if (!user?.id || !settings) return;

    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'notificationSettings', user.id), {
        isEnabled: false,
        fcmToken: null,
        updatedAt: serverTimestamp()
      });

      await loadSettings();
    } catch (err) {
      console.error('Erreur lors de la désactivation des notifications:', err);
      setError('Erreur lors de la désactivation des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les permissions spécifiques
  const updatePermissions = async (newPermissions: Partial<NotificationSettings['permissions']>): Promise<void> => {
    if (!user?.id || !settings) return;

    setLoading(true);
    setError(null);

    try {
      const updatedPermissions = {
        ...settings.permissions,
        ...newPermissions
      };

      await updateDoc(doc(db, 'notificationSettings', user.id), {
        permissions: updatedPermissions,
        updatedAt: serverTimestamp()
      });

      await loadSettings();
    } catch (err) {
      console.error('Erreur lors de la mise à jour des permissions:', err);
      setError('Erreur lors de la mise à jour des permissions');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir le token FCM
  const refreshToken = async (): Promise<void> => {
    if (!user?.id || !isSupported || !hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      const token = await generateToken();
      
      if (!token) {
        setError('Impossible d\'obtenir le nouveau token FCM');
        return;
      }

      await updateDoc(doc(db, 'notificationSettings', user.id), {
        fcmToken: token,
        updatedAt: serverTimestamp()
      });

      await loadSettings();
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du token:', err);
      setError('Erreur lors du rafraîchissement du token');
    } finally {
      setLoading(false);
    }
  };

  // Écouter les messages en premier plan
  useEffect(() => {
    if (!isSupported || !hasPermission) return;
    onMessageListener().then((payload) => {
      if (payload) {
        console.log('Message reçu en premier plan:', payload);
      }
    });
  }, [isSupported, hasPermission]);

  // Charger les paramètres au montage
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id, loadSettings]);

  // Abonnement en temps réel aux notifications utilisateur
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    // Modèle: notifications/{userId}/items
    const itemsRef = collection(db, 'notifications', user.id, 'items');
    const q = query(itemsRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AppNotification, 'id'>),
      }));
      setNotifications(list);
    }, (err) => {
      console.error('Erreur abonnement notifications:', err);
    });

    return () => unsub();
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Marquer une notification comme lue
  const markAsRead = async (id: string): Promise<void> => {
    if (!user?.id || !id) return;
    try {
      await updateDoc(doc(db, 'notifications', user.id, 'items', id), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Erreur markAsRead:', err);
      setError('Impossible de marquer la notification comme lue');
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async (): Promise<void> => {
    if (!user?.id) return;
    try {
      const itemsRef = collection(db, 'notifications', user.id, 'items');
      const qUnread = query(itemsRef, where('read', '==', false));
      const snap = await getDocs(qUnread);
      if (snap.empty) return;

      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.update(d.ref, { read: true, readAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (err) {
      console.error('Erreur markAllAsRead:', err);
      setError('Impossible de marquer toutes les notifications comme lues');
    }
  };

  return {
    settings,
    loading,
    error,
    isSupported,
    hasPermission,
    enableNotifications,
    disableNotifications,
    updatePermissions,
    refreshToken,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}
