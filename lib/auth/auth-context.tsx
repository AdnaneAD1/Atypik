'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/firebase/ClientApp';

export type UserRole = 'parent' | 'driver';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  register: (userData: any, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Login function using Firebase Authentication
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      if (userData) {
        setUser({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userData.displayName || 'Utilisateur',
          role: userData.role as UserRole,
          avatar: userData.avatar || undefined,
          status: userData.status || undefined,
        });
        
        // Rediriger en fonction du rôle
        router.push(userData.role === 'parent' ? '/parent/dashboard' : '/driver/dashboard');
      } else {
        throw new Error('Données utilisateur non trouvées');
      }
    } catch (error: any) {
      console.error('Échec de connexion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google function
  const loginWithGoogle = async (role: UserRole) => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      
      // Vérifier si l'utilisateur existe déjà dans Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        // L'utilisateur existe déjà, récupérer ses données
        const userData = userDoc.data();
        setUser({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userData.displayName || userCredential.user.displayName || 'Utilisateur',
          role: userData.role as UserRole,
          avatar: userData.avatar || userCredential.user.photoURL || undefined,
          status: userData.status || undefined,
        });
        
        // Rediriger en fonction du rôle existant
        router.push(userData.role === 'parent' ? '/parent/dashboard' : '/driver/dashboard');
      } else {
        // Nouvel utilisateur, créer un profil dans Firestore
        const displayName = userCredential.user.displayName || 'Utilisateur Google';
        const email = userCredential.user.email || '';
        const photoURL = userCredential.user.photoURL || undefined;
        
        // Stocker les données dans Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          displayName: displayName,
          email: email,
          role: role,
          avatar: photoURL,
          createdAt: serverTimestamp(),
          authProvider: 'google'
        });
        
        // Mettre à jour l'état local
        setUser({
          id: userCredential.user.uid,
          email: email,
          name: displayName,
          role: role,
          avatar: photoURL,
          status: 'pending', // Par défaut pour un nouveau chauffeur
        });
        
        // Rediriger en fonction du rôle sélectionné
        router.push(role === 'parent' ? '/parent/dashboard' : '/driver/dashboard');
      }
    } catch (error: any) {
      console.error('Échec de connexion avec Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function using Firebase Authentication
  const register = async (userData: any, role: UserRole) => {
    setLoading(true);
    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Mettre à jour le profil utilisateur
      const displayName = `${userData.firstName} ${userData.lastName}`;
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      // Stocker les données supplémentaires dans Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        role: role,
        createdAt: serverTimestamp(),
        ...(role === 'driver' && {
          licenseNumber: userData.licenseNumber,
          insuranceNumber: userData.insuranceNumber,
          regionId: userData.regionId, // Ajout de la région choisie
          status: 'pending' // Les chauffeurs doivent être approuvés
        })
      });
      
      // Mettre à jour l'état local
      setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: displayName,
        role: role,
        status: role === 'driver' ? 'pending' : undefined,
      });
      
      // Rediriger en fonction du rôle
      router.push(role === 'parent' ? '/parent/dashboard' : '/driver/dashboard');
    } catch (error: any) {
      console.error('Échec d\'inscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function using Firebase Authentication
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Échec de déconnexion:', error);
    }
  };

  // Observer for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          // L'utilisateur est connecté, récupérer ses données depuis Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          if (userData) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.displayName || firebaseUser.displayName || 'Utilisateur',
              role: userData.role as UserRole,
              avatar: userData.avatar || undefined,
              status: userData.status || undefined,
            });
          } else {
            // L'utilisateur existe dans Auth mais pas dans Firestore
            console.warn('Utilisateur authentifié mais sans données dans Firestore');
            setUser(null);
          }
        } else {
          // L'utilisateur n'est pas connecté
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    
    // Nettoyer l'observateur lors du démontage du composant
    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};