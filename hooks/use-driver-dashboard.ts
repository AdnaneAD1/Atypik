import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';

// Types pour le dashboard chauffeur
export interface DriverStats {
  todayMissions: number;
  kmTraveled: number;
  averageRating: number;
  childrenTransported: number;
  completedMissions: number;
  totalMissions: number;
}

export interface ActiveMission {
  id: string;
  status: 'active' | 'pending' | 'completed';
  child: {
    name: string;
    age: number;
    avatar?: string;
    needs?: { type: string; description: string; severity: 'low' | 'medium' | 'high'; }[];
  };
  parent: {
    name: string;
    avatar?: string;
    phone?: string;
  };
  from: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  to: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  timeEstimate: string;
  distance: number; // en mètres
  scheduledTime: string;
  progress: number; // pourcentage de progression
  time: string;
  transportType: 'aller' | 'retour' | 'aller-retour';
}

export interface UpcomingMission {
  id: string;
  child: {
    name: string;
    age: number;
    needs?: { type: string; description: string; severity: 'low' | 'medium' | 'high'; }[];
  };
  parent: {
    name: string;
    phone?: string;
  };
  from: {
    name: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  };
  scheduledTime: string;
  distance: number;
  transportType: 'aller' | 'retour' | 'aller-retour';
}

export interface FeaturedChild {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  rating: number;
  about: string;
  needs: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  parent: {
    name: string;
    phone?: string;
    email?: string;
  };
  school: {
    name: string;
    address: string;
  };
}

interface UseDriverDashboardResult {
  stats: DriverStats;
  activeMission: ActiveMission | null;
  upcomingMissions: UpcomingMission[];
  featuredChild: FeaturedChild | null;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

export function useDriverDashboard(): UseDriverDashboardResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DriverStats>({
    todayMissions: 0,
    kmTraveled: 0,
    averageRating: 0,
    childrenTransported: 0,
    completedMissions: 0,
    totalMissions: 0,
  });
  
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [upcomingMissions, setUpcomingMissions] = useState<UpcomingMission[]>([]);
  const [featuredChild, setFeaturedChild] = useState<FeaturedChild | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper pour obtenir la plage de dates d'aujourd'hui
  const getTodayRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
    };
  };

  // Récupérer les informations d'un enfant
  const getChildInfo = async (childId: string) => {
    if (!childId) return { age: null, needs: [], about: '' };
    try {
      const childDocRef = doc(db, 'children', childId);
      const childSnap = await getDoc(childDocRef);
      if (childSnap.exists()) {
        const childData = childSnap.data();
        return {
          age: childData.age ?? null,
          needs: childData.needs ?? [],
          about: childData.about ?? '',
          avatar: childData.avatar,
        };
      }
    } catch (e) {
      console.error('Erreur lors de la récupération de l\'enfant:', e);
    }
    return { age: null, needs: [], about: '', avatar: undefined };
  };

  // Récupérer les informations d'un parent
  const getParentInfo = async (parentId: string) => {
    if (!parentId) return { name: 'Parent inconnu', phone: undefined, email: undefined };
    try {
      const userDocRef = doc(db, 'users', parentId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          name: userData.displayName || userData.name || userData.email || 'Parent',
          phone: userData.phone,
          email: userData.email,
          avatar: userData.avatar,
        };
      }
    } catch (e) {
      console.error('Erreur lors de la récupération du parent:', e);
    }
    return { name: 'Parent inconnu', phone: undefined, email: undefined };
  };

  // Calculer les statistiques du chauffeur
  const calculateDriverStats = useCallback(async (driverId: string) => {
    try {
      const { start, end } = getTodayRange();
      const transportsRef = collection(db, 'transports');
      
      // Missions d'aujourd'hui
      const todayQuery = query(
        transportsRef,
        where('driverId', '==', driverId),
        where('date', '>=', start),
        where('date', '<=', end)
      );
      const todaySnapshot = await getDocs(todayQuery);
      
      // Toutes les missions du chauffeur
      const allQuery = query(
        transportsRef,
        where('driverId', '==', driverId)
      );
      const allSnapshot = await getDocs(allQuery);
      
      let todayMissions = 0;
      let kmTraveled = 0;
      let completedMissions = 0;
      let totalMissions = allSnapshot.size;
      const childrenSet = new Set<string>();
      
      // Traiter les missions d'aujourd'hui
      todaySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status !== 'cancelled') {
          todayMissions++;
          if (data.distance) {
            kmTraveled += data.distance / 1000; // Convertir en km
          }
          if (data.childId) {
            childrenSet.add(data.childId);
          }
        }
      });
      
      // Compter les missions terminées (toutes périodes)
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'completed') {
          completedMissions++;
        }
      });
      
      // Récupérer les évaluations pour calculer la note moyenne
      const reviewsRef = collection(db, 'reviews');
      const reviewsQuery = query(reviewsRef, where('driverId', '==', driverId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      let totalRating = 0;
      let ratingCount = 0;
      reviewsSnapshot.forEach((doc) => {
        const review = doc.data();
        if (review.rating) {
          totalRating += review.rating;
          ratingCount++;
        }
      });
      
      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 5.0;
      
      return {
        todayMissions,
        kmTraveled: Math.round(kmTraveled * 10) / 10, // Arrondir à 1 décimale
        averageRating: Math.round(averageRating * 10) / 10,
        childrenTransported: childrenSet.size,
        completedMissions,
        totalMissions,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }, []);

  // Récupérer la mission active
  const getActiveMission = useCallback(async (driverId: string) => {
    try {
      // Vérifier s'il y a une mission active dans la collection activeMissions
      const activeMissionsRef = collection(db, 'activeMissions');
      const activeMissionQuery = query(activeMissionsRef, where('driverId', '==', driverId));
      const activeMissionSnapshot = await getDocs(activeMissionQuery);
      
      if (!activeMissionSnapshot.empty) {
        const missionDoc = activeMissionSnapshot.docs[0];
        const missionData = missionDoc.data();
        
        // Récupérer les détails du transport
        const transportDocRef = doc(db, 'transports', missionData.transportId);
        const transportSnap = await getDoc(transportDocRef);
        
        if (transportSnap.exists()) {
          const transportData = transportSnap.data();
          const childInfo = await getChildInfo(transportData.childId);
          const parentInfo = await getParentInfo(transportData.userId);
          
          return {
            id: missionData.transportId,
            status: 'active' as const,
            child: {
              name: transportData.childName || 'Enfant',
              age: childInfo.age || 0,
              avatar: childInfo.avatar,
              needs: Array.isArray(childInfo.needs) ? childInfo.needs.map((need: any) => 
                typeof need === 'string' ? { type: need, description: need, severity: 'medium' as const } : need
              ) : undefined,
            },
            parent: {
              name: parentInfo.name,
              avatar: parentInfo.avatar,
              phone: parentInfo.phone,
            },
            from: {
              name: transportData.from?.address?.split(',')[0] || 'Départ',
              address: transportData.from?.address || '',
              lat: transportData.from?.lat,
              lng: transportData.from?.lng,
            },
            to: {
              name: transportData.to?.address?.split(',')[0] || 'Arrivée',
              address: transportData.to?.address || '',
              lat: transportData.to?.lat,
              lng: transportData.to?.lng,
            },
            timeEstimate: '15 min', // À calculer dynamiquement
            distance: transportData.distance || 0,
            scheduledTime: transportData.time,
            progress: 50, // À calculer selon la position GPS
            time: transportData.time,
            transportType: transportData.transportType || 'aller',
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la mission active:', error);
      return null;
    }
  }, []);

  // Récupérer les missions à venir
  const getUpcomingMissions = useCallback(async (driverId: string) => {
    try {
      const { start, end } = getTodayRange();
      const transportsRef = collection(db, 'transports');
      
      const upcomingQuery = query(
        transportsRef,
        where('driverId', '==', driverId),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'asc')
      );
      
      const snapshot = await getDocs(upcomingQuery);
      const missions: UpcomingMission[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Exclure les missions annulées, complétées et actives
        if (data.status === 'cancelled' || data.status === 'completed' || data.status === 'active') continue;
        
        // Limiter à 3 missions
        if (missions.length >= 3) break;
        
        const childInfo = await getChildInfo(data.childId);
        const parentInfo = await getParentInfo(data.userId);
        
        missions.push({
          id: doc.id,
          child: {
            name: data.childName || 'Enfant',
            age: childInfo.age || 0,
            needs: Array.isArray(childInfo.needs) ? childInfo.needs.map((need: any) => 
              typeof need === 'string' ? { type: need, description: need, severity: 'medium' as const } : need
            ) : undefined,
          },
          parent: {
            name: parentInfo.name,
            phone: parentInfo.phone,
          },
          from: {
            name: data.from?.address?.split(',')[0] || 'Départ',
            address: data.from?.address || '',
          },
          to: {
            name: data.to?.address?.split(',')[0] || 'Arrivée',
            address: data.to?.address || '',
          },
          scheduledTime: data.time,
          distance: data.distance || 0,
          transportType: data.transportType || 'aller',
        });
      }
      
      return missions.slice(0, 5); // Limiter à 5 missions
    } catch (error) {
      console.error('Erreur lors de la récupération des missions à venir:', error);
      return [];
    }
  }, []);

  // Récupérer l'enfant en vedette (le plus fréquemment transporté)
  const getFeaturedChild = useCallback(async (driverId: string) => {
    try {
      const transportsRef = collection(db, 'transports');
      const transportsQuery = query(
        transportsRef,
        where('driverId', '==', driverId),
        where('status', '==', 'completed')
      );
      
      const snapshot = await getDocs(transportsQuery);
      const childCounts: { [childId: string]: number } = {};
      let mostFrequentChildId = '';
      let maxCount = 0;
      
      // Compter les transports par enfant
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.childId) {
          childCounts[data.childId] = (childCounts[data.childId] || 0) + 1;
          if (childCounts[data.childId] > maxCount) {
            maxCount = childCounts[data.childId];
            mostFrequentChildId = data.childId;
          }
        }
      });
      
      if (mostFrequentChildId) {
        // Récupérer les détails de l'enfant le plus fréquent
        const childInfo = await getChildInfo(mostFrequentChildId);
        
        // Trouver un transport récent pour récupérer les infos du parent et de l'école
        const recentTransportQuery = query(
          transportsRef,
          where('childId', '==', mostFrequentChildId),
          where('driverId', '==', driverId),
          orderBy('date', 'desc')
        );
        
        const recentSnapshot = await getDocs(recentTransportQuery);
        if (!recentSnapshot.empty) {
          const recentTransport = recentSnapshot.docs[0].data();
          const parentInfo = await getParentInfo(recentTransport.userId);
          
          // Calculer la note moyenne pour cet enfant
          const reviewsRef = collection(db, 'reviews');
          const childReviewsQuery = query(
            reviewsRef,
            where('childId', '==', mostFrequentChildId),
            where('driverId', '==', driverId)
          );
          const reviewsSnapshot = await getDocs(childReviewsQuery);
          
          let totalRating = 0;
          let ratingCount = 0;
          reviewsSnapshot.forEach((doc) => {
            const review = doc.data();
            if (review.rating) {
              totalRating += review.rating;
              ratingCount++;
            }
          });
          
          const rating = ratingCount > 0 ? totalRating / ratingCount : 5.0;
          
          return {
            id: mostFrequentChildId,
            name: recentTransport.childName || 'Enfant',
            age: childInfo.age || 0,
            avatar: childInfo.avatar,
            rating: Math.round(rating * 10) / 10,
            about: childInfo.about || 'Aucune information disponible.',
            needs: childInfo.needs.map((need: string) => ({
              type: need,
              description: `Besoin spécifique: ${need}`,
              severity: 'medium' as const,
            })),
            parent: {
              name: parentInfo.name,
              phone: parentInfo.phone,
              email: parentInfo.email,
            },
            school: {
              name: recentTransport.to?.address?.split(',')[0] || 'École',
              address: recentTransport.to?.address || '',
            },
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'enfant en vedette:', error);
      return null;
    }
  }, []);

  // Charger toutes les données du dashboard
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, activeMissionData, upcomingMissionsData, featuredChildData] = await Promise.all([
        calculateDriverStats(user.id),
        getActiveMission(user.id),
        getUpcomingMissions(user.id),
        getFeaturedChild(user.id),
      ]);
      
      setStats(statsData);
      setActiveMission(activeMissionData);
      setUpcomingMissions(upcomingMissionsData);
      setFeaturedChild(featuredChildData);
      
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Impossible de charger les données du dashboard');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, calculateDriverStats, getActiveMission, getUpcomingMissions, getFeaturedChild, toast]);

  // Fonction de rafraîchissement
  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, loadDashboardData]);

  return {
    stats,
    activeMission,
    upcomingMissions,
    featuredChild,
    loading,
    error,
    refreshData,
  };
}
