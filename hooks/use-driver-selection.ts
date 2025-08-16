'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useAuth } from '@/lib/auth/auth-context';
import { useRegion } from '@/hooks/use-region';

export interface Driver {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  regionId: string;
  rating?: number;
  totalTrips?: number;
  status: 'verified' | 'pending';
  phone?: string;
  experience?: string;
  // Statistiques FIFA-style
  stats?: {
    totalMissions: number;
    completedMissions: number;
    averageRating: number;
    totalReviews: number;
    thisMonthMissions: number;
    totalKmTraveled: number;
    uniqueChildrenTransported: number;
    punctualityRate: number; // Taux de ponctualité
    reliabilityScore: number; // Score de fiabilité (0-100)
    experienceYears: number; // Années d'expérience
  };
}

export interface DriverSelectionState {
  drivers: Driver[];
  selectedDriver: Driver | null;
  loading: boolean;
  error: string | null;
}

export const useDriverSelection = () => {
  const { user, updateUser } = useAuth();
  const { userRegion } = useRegion();
  const [state, setState] = useState<DriverSelectionState>({
    drivers: [],
    selectedDriver: null,
    loading: false,
    error: null,
  });

  // Fonction pour récupérer les statistiques d'un chauffeur
  const getDriverStats = async (driverId: string) => {
    try {
      // Récupérer les missions du chauffeur
      const missionsQuery = query(
        collection(db, 'transports'),
        where('driverId', '==', driverId)
      );
      const missionsSnapshot = await getDocs(missionsQuery);
      
      // Récupérer les évaluations du chauffeur
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('driverId', '==', driverId),
        where('type', '==', 'given')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      // Calculer les statistiques
      const totalMissions = missionsSnapshot.size;
      const completedMissions = missionsSnapshot.docs.filter(doc => 
        doc.data().status === 'completed'
      ).length;
      
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
        : 0;
      
      // Calculer les missions de ce mois
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthMissions = missionsSnapshot.docs.filter(doc => {
        const missionDate = doc.data().date?.toDate();
        return missionDate && missionDate >= startOfMonth;
      }).length;
      
      // Calculer la distance totale
      const totalKmTraveled = missionsSnapshot.docs.reduce((total, doc) => {
        const distance = doc.data().distance || 0;
        return total + (distance / 1000); // Convertir en km
      }, 0);
      
      // Calculer le nombre d'enfants uniques transportés
      const uniqueChildren = new Set(
        missionsSnapshot.docs.map(doc => doc.data().childId)
      ).size;
      
      // Calculer le taux de ponctualité (simulation - à adapter selon vos critères)
      const punctualityRate = Math.min(95, 80 + (averageRating * 3));
      
      // Score de fiabilité basé sur plusieurs facteurs
      const reliabilityScore = Math.min(100, 
        (averageRating * 15) + 
        (Math.min(totalMissions / 10, 10) * 2) + 
        (punctualityRate * 0.3)
      );
      
      // Années d'expérience (simulation - à adapter)
      const experienceYears = Math.max(1, Math.floor(totalMissions / 50) + 1);
      
      return {
        totalMissions,
        completedMissions,
        averageRating,
        totalReviews: reviews.length,
        thisMonthMissions,
        totalKmTraveled,
        uniqueChildrenTransported: uniqueChildren,
        punctualityRate,
        reliabilityScore,
        experienceYears,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      // Retourner des statistiques par défaut en cas d'erreur
      return {
        totalMissions: 0,
        completedMissions: 0,
        averageRating: 0,
        totalReviews: 0,
        thisMonthMissions: 0,
        totalKmTraveled: 0,
        uniqueChildrenTransported: 0,
        punctualityRate: 0,
        reliabilityScore: 0,
        experienceYears: 1,
      };
    }
  };

  // Charger les chauffeurs de la région de l'utilisateur
  const loadDriversByRegion = useCallback(async () => {
    if (!userRegion?.id) {
      setState(prev => ({ ...prev, error: 'Région non définie' }));
      return [];
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver'),
        where('status', '==', 'verified'),
        where('regionId', '==', userRegion.id)
      );
      
      const driversSnapshot = await getDocs(driversQuery);
      const driversData: Driver[] = [];
      
      // Récupérer les statistiques pour chaque chauffeur
      const driversWithStats = await Promise.all(
        driversSnapshot.docs.map(async (driverDoc) => {
          const data = driverDoc.data();
          const driverId = driverDoc.id;
          
          // Récupérer les statistiques du chauffeur
          const stats = await getDriverStats(driverId);
          
          return {
            id: driverId,
            name: data.displayName || data.name || 'Chauffeur',
            email: data.email || '',
            avatar: data.photoURL || data.avatar,
            regionId: data.regionId,
            rating: stats.averageRating || data.rating || 0,
            totalTrips: stats.totalMissions || data.totalTrips || 0,
            status: data.status || 'active',
            phone: data.phone,
            experience: data.experience,
            stats,
          };
        })
      );
      
      setState(prev => ({ ...prev, drivers: driversWithStats, loading: false }));
      return driversWithStats;
    } catch (error) {
      console.error('Erreur lors du chargement des chauffeurs:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Impossible de charger les chauffeurs' 
      }));
      return [];
    }
  }, [userRegion?.id]);

  // Charger le chauffeur sélectionné par l'utilisateur
  const loadSelectedDriver = useCallback(async (driverId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const driverDoc = await getDoc(doc(db, 'users', driverId));
      
      if (driverDoc.exists()) {
        const data = driverDoc.data();
        const driver: Driver = {
          id: driverDoc.id,
          name: data.displayName || data.name || 'Chauffeur',
          email: data.email || '',
          avatar: data.avatar,
          regionId: data.regionId,
          rating: data.rating || 0,
          totalTrips: data.totalTrips || 0,
          status: data.status || 'active',
          phone: data.phone,
          experience: data.experience,
        };
        
        setState(prev => ({ ...prev, selectedDriver: driver, loading: false }));
        return driver;
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Chauffeur introuvable' 
        }));
        return null;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du chauffeur sélectionné:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Impossible de charger le chauffeur sélectionné' 
      }));
      return null;
    }
  }, []);

  // Sélectionner un chauffeur et sauvegarder dans le profil utilisateur
  const selectDriver = async (driver: Driver) => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'Utilisateur non connecté' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mettre à jour le profil utilisateur avec le chauffeur sélectionné
      await updateUser({ selectedDriverId: driver.id });
      
      setState(prev => ({ 
        ...prev, 
        selectedDriver: driver, 
        loading: false 
      }));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la sélection du chauffeur:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Impossible de sélectionner le chauffeur' 
      }));
      return false;
    }
  };

  // Initialiser les données au montage du composant
  useEffect(() => {
    if (user && user.role === 'parent' && userRegion?.id) {
      // Charger les chauffeurs de la région
      loadDriversByRegion();
      
      // Charger le chauffeur sélectionné si disponible
      if (user.selectedDriverId) {
        loadSelectedDriver(user.selectedDriverId);
      }
    }
  }, [user, userRegion, loadDriversByRegion, loadSelectedDriver]);

  return {
    ...state,
    loadDriversByRegion,
    loadSelectedDriver,
    selectDriver,
    hasSelectedDriver: !!state.selectedDriver,
    canCreateTransport: !!state.selectedDriver && !state.loading,
  };
};
