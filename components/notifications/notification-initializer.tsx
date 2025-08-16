'use client';

import { useEffect } from 'react';

export function NotificationInitializer() {
  useEffect(() => {
    // Initialiser le service worker au chargement de l'application
    const initializeServiceWorker = async () => {
      if (typeof window === 'undefined') return;
      
      if ('serviceWorker' in navigator) {
        try {
          // Vérifier si le service worker est déjà enregistré
          const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope');
          
          if (!existingRegistration) {
            console.log('Enregistrement du service worker Firebase...');
            
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/firebase-cloud-messaging-push-scope',
            });
            
            console.log('Service Worker Firebase enregistré avec succès:', registration);
            
            // Attendre que le service worker soit prêt
            await navigator.serviceWorker.ready;
            console.log('Service Worker Firebase prêt');
            
          } else {
            console.log('Service Worker Firebase déjà enregistré:', existingRegistration);
          }
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement du service worker:', error);
        }
      } else {
        console.warn('Service Workers non supportés par ce navigateur');
      }
    };

    // Délai pour éviter de bloquer le rendu initial
    const timer = setTimeout(initializeServiceWorker, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Ce composant ne rend rien
  return null;
}
