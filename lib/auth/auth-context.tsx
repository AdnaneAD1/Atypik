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
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/firebase/ClientApp';

export type UserRole = 'parent' | 'driver' | 'admin';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status?: string;
  regionId?: string;
  selectedDriverId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  register: (userData: any, role: UserRole) => Promise<void>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
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
          regionId: userData.regionId || undefined,
          selectedDriverId: userData.selectedDriverId || undefined,
        });
        
        // Rediriger en fonction du rôle
        router.push(
          userData.role === 'parent'
            ? '/parent/dashboard'
            : userData.role === 'driver'
            ? '/driver/dashboard'
            : '/admin/dashboard'
        );
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
          regionId: userData.regionId || undefined,
          selectedDriverId: userData.selectedDriverId || undefined,
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
      
      // Envoi email de confirmation si nouveau compte chauffeur (best-effort, template brandé)
      try {
        if (role === 'driver' && userData.email) {
          const subject = 'Atypik Driver • Votre compte chauffeur a été créé';
          const messageHtml = `
            <p style="margin:4px 0;">Bienvenue ${displayName},</p>
            <p style="margin:4px 0;">Votre compte chauffeur a bien été créé.</p>
            <p style="margin:4px 0;">Votre compte est en cours d\'examen par notre équipe. Vous serez contacté dès que votre profil aura été validé.</p>
          `;
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: userData.email,
              subject,
              template: 'generic',
              variables: { title: 'Compte chauffeur créé', messageHtml },
            }),
          });
        }
      } catch (e) {
        console.error('Erreur envoi email inscription chauffeur:', e);
      }

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

  // Update user function
  const updateUser = async (data: Partial<User>) => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    try {
      // Mettre à jour dans Firestore
      await updateDoc(doc(db, 'users', user.id), data);
      
      // Mettre à jour l'état local
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  };

  // Delete account function
  const deleteAccount = async (password: string): Promise<void> => {
    if (!user) throw new Error('Aucun utilisateur connecté');
    
    setLoading(true);
    try {
      // Récupérer l'utilisateur Firebase actuel
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('Utilisateur Firebase non trouvé');
      }

      // Réauthentifier l'utilisateur pour les opérations sensibles
      const credential = EmailAuthProvider.credential(firebaseUser.email, password);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Supprimer toutes les données associées à l'utilisateur
      await deleteUserData(user.id);

      // Supprimer le compte Firebase Auth
      await deleteUser(firebaseUser);

      // Nettoyer l'état local et rediriger
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw error;
    } finally {
      setLoading(false);
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
              regionId: userData.regionId || undefined,
              selectedDriverId: userData.selectedDriverId || undefined,
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
        deleteAccount,
        updateUser,
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