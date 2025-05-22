import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { FirebaseError } from 'firebase/app';

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
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const { login: authLogin, loginWithGoogle: authLoginWithGoogle, register: authRegister, logout: authLogout } = useAuth();
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

  return {
    login,
    loginWithGoogle,
    register,
    logout,
    isLoading,
    error,
    clearError,
  };
}
