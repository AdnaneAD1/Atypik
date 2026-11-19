import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { FirebaseError } from 'firebase/app';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/firebase/ClientApp';
import { getAuthErrorMessage } from '@/lib/auth/auth-errors';

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

  const login = async (email: string, password: string): Promise<void> => {
    clearError();
    setIsLoading(true);
    try {
      await authLogin(email, password);
    } catch (error) {
      setError(getAuthErrorMessage(error));
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
      setError(getAuthErrorMessage(error));
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
      setError(getAuthErrorMessage(error));
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
      setError(getAuthErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction utilitaire pour supprimer les données de l'utilisateur
  const deleteUserData = async (userId: string): Promise<void> => {
    const batch = writeBatch(db);

    // Supprimer le profil utilisateur
    const userDocRef = doc(db, 'users', userId);
    batch.delete(userDocRef);

    // Supprimer les documents de l'utilisateur
    const documentsQuery = query(collection(db, 'documents'), where('userId', '==', userId));
    const documentsSnapshot = await getDocs(documentsQuery);
    documentsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Supprimer les enfants si c'est un parent
    if (currentUser?.role === 'parent') {
      const childrenQuery = query(collection(db, 'children'), where('parentId', '==', userId));
      const childrenSnapshot = await getDocs(childrenQuery);
      childrenSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    // Exécuter le batch
    await batch.commit();
  };

  return {
    login,
    loginWithGoogle,
    register,
    logout,
    deleteAccount,
    isLoading,
    error,
    clearError
  };
}
