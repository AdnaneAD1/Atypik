import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { FirebaseError } from 'firebase/app';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/firebase/ClientApp';

type AuthErrorCode = 
  | 'auth/invalid-email'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/operation-not-allowed'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests'
  | 'auth/popup-closed-by-user'
  | 'auth/requires-recent-login'
  | string;

interface UseFirebaseAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (role: 'parent' | 'driver') => Promise<void>;
  register: (userData: any, role: 'parent' | 'driver') => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const { login: authLogin, loginWithGoogle: authLoginWithGoogle, register: authRegister, logout: authLogout, user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const getErrorMessage = (code: AuthErrorCode): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email ou mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
      case 'auth/network-request-failed':
        return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives de connexion. Veuillez réessayer plus tard.';
      case 'auth/requires-recent-login':
        return 'Cette opération nécessite une connexion récente. Veuillez vous reconnecter.';
      default:
        return 'Une erreur s\'est produite. Veuillez réessayer.';
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    clearError();
    setIsLoading(true);
    try {
      await authLogin(email, password);
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getErrorMessage(error.code as AuthErrorCode));
      } else {
        setError('Une erreur s\'est produite lors de la connexion.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any, role: 'parent' | 'driver'): Promise<void> => {
    clearError();
    setIsLoading(true);
    try {
      await authRegister(userData, role);
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getErrorMessage(error.code as AuthErrorCode));
      } else {
        setError('Une erreur s\'est produite lors de l\'inscription.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: 'parent' | 'driver'): Promise<void> => {
    clearError();
    setIsLoading(true);
    try {
      await authLoginWithGoogle(role);
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getErrorMessage(error.code as AuthErrorCode));
      } else {
        setError('Une erreur s\'est produite lors de la connexion avec Google.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    clearError();
    setIsLoading(true);
    try {
      await authLogout();
    } catch (error) {
      setError('Une erreur s\'est produite lors de la déconnexion.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (password: string): Promise<void> => {
    clearError();
    setIsLoading(true);
    
    try {
      if (!currentUser) {
        throw new Error('Aucun utilisateur connecté');
      }

      // Récupérer l'utilisateur Firebase actuel
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('Utilisateur Firebase non trouvé');
      }

      // Réauthentifier l'utilisateur pour les opérations sensibles
      const credential = EmailAuthProvider.credential(firebaseUser.email, password);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Supprimer toutes les données associées à l'utilisateur
      await deleteUserData(currentUser.id);

      // Supprimer le compte Firebase Auth
      await deleteUser(firebaseUser);

    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getErrorMessage(error.code as AuthErrorCode));
      } else {
        setError('Une erreur s\'est produite lors de la suppression du compte.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour supprimer toutes les données utilisateur
  const deleteUserData = async (userId: string): Promise<void> => {
    const batch = writeBatch(db);

    try {
      // 1. Supprimer le document utilisateur principal
      const userDocRef = doc(db, 'users', userId);
      batch.delete(userDocRef);

      // 2. Supprimer les messages où l'utilisateur est participant
      const messagesQuery = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', userId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Supprimer les conversations où l'utilisateur est participant
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      conversationsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 4. Supprimer les transports créés par l'utilisateur ou qui lui sont assignés
      const transportsAsUserQuery = query(
        collection(db, 'transports'),
        where('userId', '==', userId)
      );
      const transportsAsUserSnapshot = await getDocs(transportsAsUserQuery);
      transportsAsUserSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const transportsAsDriverQuery = query(
        collection(db, 'transports'),
        where('driverId', '==', userId)
      );
      const transportsAsDriverSnapshot = await getDocs(transportsAsDriverQuery);
      transportsAsDriverSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 4b. Supprimer les missions actives liées à l'utilisateur
      const activeMissionsAsDriverQuery = query(
        collection(db, 'activeMissions'),
        where('driverId', '==', userId)
      );
      const activeMissionsSnapshot = await getDocs(activeMissionsAsDriverQuery);
      activeMissionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 4c. Supprimer les positions GPS de l'utilisateur
      const gpsPositionsQuery = query(
        collection(db, 'gpsPositions'),
        where('driverId', '==', userId)
      );
      const gpsPositionsSnapshot = await getDocs(gpsPositionsQuery);
      gpsPositionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 4d. Supprimer les gains de l'utilisateur
      const gainsQuery = query(
        collection(db, 'gains'),
        where('driverId', '==', userId)
      );
      const gainsSnapshot = await getDocs(gainsQuery);
      gainsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 5. Supprimer les notifications de/vers l'utilisateur
      const notificationsFromQuery = query(
        collection(db, 'notifications'),
        where('fromUserId', '==', userId)
      );
      const notificationsFromSnapshot = await getDocs(notificationsFromQuery);
      notificationsFromSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const notificationsToQuery = query(
        collection(db, 'notifications'),
        where('toUserId', '==', userId)
      );
      const notificationsToSnapshot = await getDocs(notificationsToQuery);
      notificationsToSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 6. Supprimer les évaluations données ou reçues par l'utilisateur
      const reviewsFromQuery = query(
        collection(db, 'reviews'),
        where('fromUserId', '==', userId)
      );
      const reviewsFromSnapshot = await getDocs(reviewsFromQuery);
      reviewsFromSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const reviewsToQuery = query(
        collection(db, 'reviews'),
        where('toUserId', '==', userId)
      );
      const reviewsToSnapshot = await getDocs(reviewsToQuery);
      reviewsToSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 7. Supprimer les enfants associés (si parent)
      const childrenQuery = query(
        collection(db, 'children'),
        where('parentId', '==', userId)
      );
      const childrenSnapshot = await getDocs(childrenQuery);
      childrenSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 8. Supprimer les tokens FCM
      const fcmTokensQuery = query(
        collection(db, 'fcmTokens'),
        where('userId', '==', userId)
      );
      const fcmTokensSnapshot = await getDocs(fcmTokensQuery);
      fcmTokensSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Exécuter toutes les suppressions en batch
      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la suppression des données utilisateur:', error);
      throw error;
    }
  };

  return {
    login,
    loginWithGoogle,
    register,
    logout,
    deleteAccount,
    isLoading,
    error,
    clearError,
  };
}
