'use client';

import { app } from '@/firebase/ClientApp';

let messaging: any | null = null;

// Initialiser Firebase Messaging
export const initializeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const { getMessaging } = await import('firebase/messaging');
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Firebase Messaging:', error);
    return null;
  }
};

// Obtenir le token FCM
export const getFCMToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  if (!messaging) {
    messaging = await initializeMessaging();
  }
  if (!messaging) {
    console.error('Firebase Messaging non initialisé');
    return null;
  }

  try {
    // Vérifier si le service worker est disponible
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker non supporté par ce navigateur');
      return null;
    }

    // Enregistrer le service worker manuellement si nécessaire
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });
      console.log('Service Worker enregistré:', registration);
    } catch (swError) {
      console.error('Erreur d\'enregistrement du Service Worker:', swError);
      // Continuer même si l'enregistrement échoue, Firebase peut gérer cela
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key manquante dans les variables d\'environnement');
      return null;
    }

    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: undefined // Laisser Firebase gérer l'enregistrement
    });

    if (token) {
      console.log('Token FCM obtenu:', token);
      return token;
    } else {
      console.log('Aucun token FCM disponible');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token FCM:', error);
    return null;
  }
};

// Écouter les messages en premier plan
export const onMessageListener = async () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!messaging) {
    messaging = await initializeMessaging();
  }
  if (!messaging) {
    return Promise.resolve(null);
  }
  const { onMessage } = await import('firebase/messaging');
  return new Promise((resolve) => {
    onMessage(messaging!, (payload) => {
      console.log('Message reçu en premier plan:', payload);
      resolve(payload);
    });
  });
};

// Demander la permission pour les notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notifications refusées par l\'utilisateur');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return false;
  }
};
