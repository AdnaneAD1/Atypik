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
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
// self.addEventListener('notificationclick', (event) => {
//   console.log('Clic sur notification:', event);

//   event.notification.close();

//   if (event.action === 'dismiss') {
//     return;
//   }

//   // Ouvrir l'application ou naviguer vers une page spécifique
//   const urlToOpen = getUrlFromNotification(event.notification.data);
  
//   event.waitUntil(
//     clients.matchAll({ type: 'window', includeUncontrolled: true })
//       .then((clientList) => {
//         // Vérifier si l'application est déjà ouverte
//         for (const client of clientList) {
//           if (client.url === urlToOpen && 'focus' in client) {
//             return client.focus();
//           }
//         }
        
//         // Ouvrir une nouvelle fenêtre si l'application n'est pas ouverte
//         if (clients.openWindow) {
//           return clients.openWindow(urlToOpen);
//         }
//       })
//   );
// });

// // Fonction pour déterminer l'URL à ouvrir selon le type de notification
// function getUrlFromNotification(data) {
//   const baseUrl = self.location.origin;
  
//   if (!data) {
//     return baseUrl;
//   }

//   switch (data.type) {
//     case 'transport':
//       return `${baseUrl}/parent/calendar`;
//     case 'message':
//       return `${baseUrl}/parent/messages`;
//     case 'driver_transport':
//       return `${baseUrl}/driver/calendar`;
//     case 'driver_message':
//       return `${baseUrl}/driver/messages`;
//     default:
//       return baseUrl;
//   }
// }
