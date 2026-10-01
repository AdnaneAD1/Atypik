importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Configuration Firebase - REMPLACEZ par votre vraie configuration
// Copiez les valeurs depuis votre fichier .env.local ou firebase/ClientApp.ts
firebase.initializeApp({
  apiKey: "AIzaSyCi3-UTsmQY0IWsO4ERvIPImKBjjif3gVk",
  authDomain: "atypik-f78a1.firebaseapp.com",
  projectId: "atypik-f78a1",
  storageBucket: "atypik-f78a1.firebasestorage.app",
  messagingSenderId: "194839811922",
  appId: "1:194839811922:web:d0a9a1360fc2448a7acc8b"
});

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Atypik Driver';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.image || payload.data?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: {
      ...(payload.data || {}),
      url: payload.data?.url || payload.data?.clickAction || payload.fcmOptions?.link || '',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Déterminer l'URL cible
  const urlToOpen = getUrlFromNotification(event.notification.data);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si un onglet Atypik est déjà ouvert, naviguer dessus et le mettre au premier plan
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }

      // Sinon, ouvrir une nouvelle fenêtre vers l'URL cible
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fonction pour déterminer l'URL à ouvrir selon les données de la notification
function getUrlFromNotification(data) {
  const origin = self.location.origin;

  if (!data) {
    return `${origin}/`;
  }

  if (data.url) {
    return data.url.startsWith('http') ? data.url : `${origin}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
  }

  if (data.clickAction) {
    return data.clickAction.startsWith('http') ? data.clickAction : `${origin}${data.clickAction.startsWith('/') ? '' : '/'}${data.clickAction}`;
  }

  switch (data.type) {
    case 'message':
    case 'driver_message':
      if (data.conversationId) {
        return `${origin}/parent/messages?conversationId=${data.conversationId}`;
      }
      return `${origin}/parent/messages`;
    case 'transport':
    case 'driver_transport':
      if (data.transportId) {
        return `${origin}/parent/tracking?transportId=${data.transportId}`;
      }
      return `${origin}/parent/calendar`;
    default:
      return `${origin}/`;
  }
}

