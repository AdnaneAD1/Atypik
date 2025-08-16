import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure le provider Google pour demander le profil et l'email
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { app, auth, db, googleProvider };

// Initialise Messaging côté client uniquement
export const getClientMessaging = async () => {
    if (typeof window === 'undefined') return null;
    try {
        const { getMessaging } = await import('firebase/messaging');
        return getMessaging(app);
    } catch (e) {
        // Environnements sans support FCM ou import échoué
        console.warn('Firebase Messaging non initialisé (client only):', e);
        return null;
    }
};

export const generateToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
        if (!('Notification' in window)) return null;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('NEXT_PUBLIC_FIREBASE_VAPID_KEY manquante');
            return null;
        }

        const msg = await getClientMessaging();
        if (!msg) return null;

        const { getToken } = await import('firebase/messaging');
        const token = await getToken(msg, { vapidKey });
        if (token) {
            console.log('FCM token:', token);
            return token;
        }
        return null;
    } catch (err) {
        console.error('Erreur generateToken:', err);
        return null;
    }
}

export const onMessageListener = async () => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    const msg = await getClientMessaging();
    if (!msg) return Promise.resolve(null);
    const { onMessage } = await import('firebase/messaging');
    return new Promise((resolve) => {
        onMessage(msg, (payload: any) => {
            resolve(payload);
        });
    });
}