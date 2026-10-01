import { admin, adminDb } from '@/lib/firebase/admin';

export interface VerifiedAuthUser {
  uid: string;
  email?: string;
  role?: string;
}

/**
 * Vérifie le token Firebase Auth présent dans l'en-tête Authorization: Bearer <token>
 * ou une clé secrète interne pour les appels machine-to-machine.
 */
export async function verifyAuthToken(req: Request): Promise<VerifiedAuthUser | null> {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      // Possibilité d'autoriser un secret interne pour tâches cron ou scripts de maintenance
      const internalKey = req.headers.get('x-internal-secret');
      if (internalKey && process.env.INTERNAL_API_SECRET && internalKey === process.env.INTERNAL_API_SECRET) {
        return { uid: 'system', role: 'admin' };
      }
      return null;
    }

    if (!admin.apps.length) {
      console.error('[verifyAuthToken] Firebase Admin non initialisé');
      return null;
    }

    const decoded = await admin.auth().verifyIdToken(token).catch((err) => {
      console.warn('[verifyAuthToken] Token invalide ou expiré:', err?.message);
      return null;
    });

    if (!decoded?.uid) return null;

    // Récupérer le rôle utilisateur depuis Firestore
    const userDoc = await adminDb().collection('users').doc(decoded.uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : undefined;

    return {
      uid: decoded.uid,
      email: decoded.email,
      role,
    };
  } catch (err) {
    console.error('[verifyAuthToken] Erreur vérification token:', err);
    return null;
  }
}
