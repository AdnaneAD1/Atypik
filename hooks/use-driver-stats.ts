import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';

// Types pour les statistiques chauffeur
export interface DriverStatsData {
  // Statistiques principales
  totalMissions: number;
  completedMissions: number;
  cancelledMissions: number;
  todayMissions: number;
  thisWeekMissions: number;
  thisMonthMissions: number;
  
  // Distances et géographie
  totalKmTraveled: number;
  thisWeekKmTraveled: number;
  thisMonthKmTraveled: number;
  
  // Évaluations et satisfaction
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  
  // Enfants et familles
  totalChildrenTransported: number;
  uniqueChildrenThisMonth: number;
  uniqueFamiliesServed: number;
  
  // Activité hebdomadaire (pour le graphique)
  weeklyActivity: number[]; // [Lun, Mar, Mer, Jeu, Ven, Sam, Dim]
  
  // Dates importantes
  lastMissionDate: Date | null;
  firstMissionDate: Date | null;
  
  // Tendances (comparaison avec période précédente)
  trends: {
    missionsGrowth: number; // % de croissance des missions vs mois dernier
    kmGrowth: number; // % de croissance des km vs mois dernier
    ratingTrend: number; // évolution de la note vs mois dernier
  };
}

interface UseDriverStatsResult {
  stats: DriverStatsData;
  loading: boolean;
  error: string | null;
  refreshStats: () => void;
}

export function useDriverStats(): UseDriverStatsResult {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DriverStatsData>({
    totalMissions: 0,
    completedMissions: 0,
    cancelledMissions: 0,
    todayMissions: 0,
    thisWeekMissions: 0,
    thisMonthMissions: 0,
    totalKmTraveled: 0,
    thisWeekKmTraveled: 0,
    thisMonthKmTraveled: 0,
    averageRating: 5.0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    totalChildrenTransported: 0,
    uniqueChildrenThisMonth: 0,
    uniqueFamiliesServed: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    lastMissionDate: null,
    firstMissionDate: null,
    trends: {
      missionsGrowth: 0,
      kmGrowth: 0,
      ratingTrend: 0,
    },
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper pour obtenir les plages de dates
  const getDateRanges = () => {
    const now = new Date();
    
    // Aujourd'hui
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Cette semaine (lundi à dimanche)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Dimanche = 0, donc -6 pour aller au lundi
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Ce mois-ci
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Mois dernier (pour les tendances)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    return {
      today: { start: Timestamp.fromDate(todayStart), end: Timestamp.fromDate(todayEnd) },
      week: { start: Timestamp.fromDate(weekStart), end: Timestamp.fromDate(weekEnd) },
      month: { start: Timestamp.fromDate(monthStart), end: Timestamp.fromDate(monthEnd) },
      lastMonth: { start: Timestamp.fromDate(lastMonthStart), end: Timestamp.fromDate(lastMonthEnd) },
    };
  };

  // Calculer les statistiques des transports
  const calculateTransportStats = async (driverId: string) => {
    const transportsRef = collection(db, 'transports');
    const ranges = getDateRanges();
    
    // Récupérer tous les transports du chauffeur
    const allTransportsQuery = query(
      transportsRef,
      where('driverId', '==', driverId),
      orderBy('date', 'desc')
    );
    const allTransportsSnapshot = await getDocs(allTransportsQuery);
    
    let totalMissions = 0;
    let completedMissions = 0;
    let cancelledMissions = 0;
    let todayMissions = 0;
    let thisWeekMissions = 0;
    let thisMonthMissions = 0;
    let totalKmTraveled = 0;
    let thisWeekKmTraveled = 0;
    let thisMonthKmTraveled = 0;
    let lastMissionDate: Date | null = null;
    let firstMissionDate: Date | null = null;
    
    const childrenSet = new Set<string>();
    const familiesSet = new Set<string>();
    const childrenThisMonth = new Set<string>();
    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]; // [Lun, Mar, Mer, Jeu, Ven, Sam, Dim]
    
    // Statistiques du mois dernier pour les tendances
    let lastMonthMissions = 0;
    let lastMonthKm = 0;
    
    allTransportsSnapshot.forEach((doc) => {
      const transport = doc.data();
      const transportDate = transport.date.toDate();
      const transportTimestamp = transport.date;
      
      totalMissions++;
      
      // Statuts
      if (transport.status === 'completed') {
        completedMissions++;
      } else if (transport.status === 'cancelled') {
        cancelledMissions++;
      }
      
      // Distance (convertir en km si en mètres)
      const distance = transport.distance || 0;
      const distanceKm = distance > 1000 ? distance / 1000 : distance;
      totalKmTraveled += distanceKm;
      
      // Enfants et familles
      if (transport.childId) {
        childrenSet.add(transport.childId);
      }
      if (transport.userId) {
        familiesSet.add(transport.userId);
      }
      
      // Dates importantes
      if (!lastMissionDate || transportDate > lastMissionDate) {
        lastMissionDate = transportDate;
      }
      if (!firstMissionDate || transportDate < firstMissionDate) {
        firstMissionDate = transportDate;
      }
      
      // Statistiques par période
      if (transportTimestamp >= ranges.today.start && transportTimestamp <= ranges.today.end) {
        todayMissions++;
      }
      
      if (transportTimestamp >= ranges.week.start && transportTimestamp <= ranges.week.end) {
        thisWeekMissions++;
        thisWeekKmTraveled += distanceKm;
        
        // Activité hebdomadaire (0 = Dimanche, 1 = Lundi, etc.)
        const dayOfWeek = transportDate.getDay();
        const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir pour que 0 = Lundi
        weeklyActivity[mondayBasedDay]++;
      }
      
      if (transportTimestamp >= ranges.month.start && transportTimestamp <= ranges.month.end) {
        thisMonthMissions++;
        thisMonthKmTraveled += distanceKm;
        if (transport.childId) {
          childrenThisMonth.add(transport.childId);
        }
      }
      
      // Statistiques du mois dernier pour les tendances
      if (transportTimestamp >= ranges.lastMonth.start && transportTimestamp <= ranges.lastMonth.end) {
        lastMonthMissions++;
        lastMonthKm += distanceKm;
      }
    });
    
    // Calculer les tendances
    const missionsGrowth = lastMonthMissions > 0 
      ? ((thisMonthMissions - lastMonthMissions) / lastMonthMissions) * 100 
      : thisMonthMissions > 0 ? 100 : 0;
    
    const kmGrowth = lastMonthKm > 0 
      ? ((thisMonthKmTraveled - lastMonthKm) / lastMonthKm) * 100 
      : thisMonthKmTraveled > 0 ? 100 : 0;
    
    return {
      totalMissions,
      completedMissions,
      cancelledMissions,
      todayMissions,
      thisWeekMissions,
      thisMonthMissions,
      totalKmTraveled: Math.round(totalKmTraveled * 10) / 10,
      thisWeekKmTraveled: Math.round(thisWeekKmTraveled * 10) / 10,
      thisMonthKmTraveled: Math.round(thisMonthKmTraveled * 10) / 10,
      totalChildrenTransported: childrenSet.size,
      uniqueChildrenThisMonth: childrenThisMonth.size,
      uniqueFamiliesServed: familiesSet.size,
      weeklyActivity,
      lastMissionDate,
      firstMissionDate,
      trends: {
        missionsGrowth: Math.round(missionsGrowth * 10) / 10,
        kmGrowth: Math.round(kmGrowth * 10) / 10,
        ratingTrend: 0, // Sera calculé avec les reviews
      },
    };
  };

  // Calculer les statistiques des évaluations
  const calculateReviewStats = async (driverId: string) => {
    const reviewsRef = collection(db, 'reviews');
    const ranges = getDateRanges();
    
    // Récupérer toutes les évaluations du chauffeur
    const reviewsQuery = query(
      reviewsRef,
      where('driverId', '==', driverId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    let totalRating = 0;
    let totalReviews = 0;
    let thisMonthRating = 0;
    let thisMonthReviews = 0;
    let lastMonthRating = 0;
    let lastMonthReviews = 0;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviewsSnapshot.forEach((doc) => {
      const review = doc.data();
      const reviewDate = review.createdAt?.toDate();
      const rating = review.rating || 5;
      
      if (rating >= 1 && rating <= 5) {
        totalRating += rating;
        totalReviews++;
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
        
        if (reviewDate) {
          const reviewTimestamp = Timestamp.fromDate(reviewDate);
          
          // Ce mois-ci
          if (reviewTimestamp >= ranges.month.start && reviewTimestamp <= ranges.month.end) {
            thisMonthRating += rating;
            thisMonthReviews++;
          }
          
          // Mois dernier
          if (reviewTimestamp >= ranges.lastMonth.start && reviewTimestamp <= ranges.lastMonth.end) {
            lastMonthRating += rating;
            lastMonthReviews++;
          }
        }
      }
    });
    
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 5.0;
    const thisMonthAverage = thisMonthReviews > 0 ? thisMonthRating / thisMonthReviews : 5.0;
    const lastMonthAverage = lastMonthReviews > 0 ? lastMonthRating / lastMonthReviews : 5.0;
    
    const ratingTrend = lastMonthAverage > 0 
      ? ((thisMonthAverage - lastMonthAverage) / lastMonthAverage) * 100 
      : 0;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      ratingTrend: Math.round(ratingTrend * 10) / 10,
    };
  };

  // Fonction principale pour charger toutes les statistiques
  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculer les statistiques en parallèle
      const [transportStats, reviewStats] = await Promise.all([
        calculateTransportStats(user.id),
        calculateReviewStats(user.id),
      ]);
      
      // Combiner toutes les statistiques
      const combinedStats: DriverStatsData = {
        ...transportStats,
        ...reviewStats,
        trends: {
          ...transportStats.trends,
          ratingTrend: reviewStats.ratingTrend,
        },
      };
      
      setStats(combinedStats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Fonction de rafraîchissement
  const refreshStats = useCallback(() => {
    loadStats();
  }, [loadStats]);

  // Charger les statistiques au montage et quand l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id, loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
