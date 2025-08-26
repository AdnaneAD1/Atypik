import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';

// Types pour les données du dashboard
export type DashboardStats = {
  totalTrips: number;
  completedTrips: number;
  upcomingTrips: number;
  activeTrips: number;
};

export type UpcomingTrip = {
  id: string;
  childName: string;
  driverName: string;
  driverAvatar?: string;
  from: {
    address: string;
    lat: number;
    lng: number;
  };
  to: {
    address: string;
    lat: number;
    lng: number;
  };
  scheduledTime: Date;
  estimatedArrival?: Date;
  status: 'programmed' | 'in-progress' | 'completed' | 'cancelled';
  transportType: 'aller' | 'retour' | 'aller-retour';
  distance: number;
};

export type WeeklySchedule = {
  date: Date;
  trips: {
    id: string;
    childName: string;
    time: string;
    type: 'aller' | 'retour';
    status: 'programmed' | 'in-progress' | 'completed' | 'cancelled';
    from: {
      address: string;
      lat: number;
      lng: number;
    };
    to: {
      address: string;
      lat: number;
      lng: number;
    };
  }[];
};

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  school: string;
  grade: string;
  totalTrips: number;
  favoriteDriver?: string;
  lastTrip?: Date;
  personality?: string; // ✅ Ajout de la personnalité
  needs?: string[]; // ✅ Ajout des besoins spécifiques
  preferences?: {
    music: boolean;
    stories: boolean;
    games: boolean;
  };
};

export type Review = {
  id: string;
  type: 'received' | 'given';
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerRole: 'driver' | 'parent';
  rating: number;
  comment: string;
  date: Date;
  tripType: 'aller' | 'retour';
  childName?: string;
  canReply?: boolean;
  hasReplied?: boolean;
  recipientName?: string; // Nom du destinataire de l'évaluation
};

export type Notification = {
  id: string;
  type: 'trip_started' | 'trip_completed' | 'review_received' | 'schedule_change' | 'driver_message';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
};

export function useDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // États pour les données
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    completedTrips: 0,
    upcomingTrips: 0,
    activeTrips: 0,
  });
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques du dashboard
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const transportsRef = collection(db, 'transports');
      const userTransportsQuery = query(transportsRef, where('userId', '==', user.id));
      const transportsSnapshot = await getDocs(userTransportsQuery);

      const now = new Date();
      let totalTrips = 0;
      let completedTrips = 0;
      let upcomingTrips = 0;
      let activeTrips = 0;

      transportsSnapshot.forEach((doc) => {
        const data = doc.data();
        const tripDate = data.date.toDate();
        
        totalTrips++;
        
        if (tripDate < now) {
          completedTrips++;
        } else if (tripDate.toDateString() === now.toDateString()) {
          // Vérifier si le trajet est actif
          const activeMissionsRef = collection(db, 'activeMissions');
          const activeMissionQuery = query(activeMissionsRef, where('transportId', '==', doc.id));
          getDocs(activeMissionQuery).then((activeSnapshot) => {
            if (!activeSnapshot.empty) {
              activeTrips++;
            }
          });
        } else {
          upcomingTrips++;
        }
      });

      setStats({
        totalTrips,
        completedTrips,
        upcomingTrips,
        activeTrips,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }, [user?.id]);

  // Charger les prochains trajets
  const loadUpcomingTrips = useCallback(async () => {
    if (!user?.id) return;

    try {
      const transportsRef = collection(db, 'transports');
      // Inclure tous les trajets à partir du début de la journée courante
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const upcomingQuery = query(
        transportsRef,
        where('userId', '==', user.id),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        orderBy('date', 'asc'),
        limit(5)
      );

      const snapshot = await getDocs(upcomingQuery);

      // Préparer la liste des IDs de transports à vérifier dans activeMissions
      const transportIds = snapshot.docs.map(d => d.id);
      let activeTransportIds = new Set<string>();

      if (transportIds.length > 0) {
        try {
          // Firestore 'in' supporte jusqu'à 10 éléments, nous sommes limités à 5 ci-dessus
          const activeRef = collection(db, 'activeMissions');
          const activeQueryRef = query(activeRef, where('transportId', 'in', transportIds));
          const activeSnap = await getDocs(activeQueryRef);
          activeSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.transportId) activeTransportIds.add(data.transportId);
          });
        } catch (e) {
          console.error('Erreur lors de la vérification des missions actives:', e);
        }
      }

      const trips: UpcomingTrip[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Récupérer les informations du chauffeur
        let driverName = 'Chauffeur assigné';
        let driverAvatar = undefined;
        
        if (data.driverId) {
          try {
            const driverDoc = await getDoc(doc(db, 'users', data.driverId));
            if (driverDoc.exists()) {
              const driverData = driverDoc.data();
              driverName = driverData.name || 'Chauffeur assigné';
              driverAvatar = driverData.avatar;
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du chauffeur:', error);
          }
        }

        const isActive = activeTransportIds.has(docSnap.id);

        // Exclure les trajets terminés ou annulés de la liste des prochains trajets
        const dbStatus: string | undefined = (data as any).status;
        if (dbStatus === 'completed' || dbStatus === 'cancelled') {
          continue;
        }

        // Calculer l'heure planifiée en combinant date + time si disponible
        const scheduledDate: Date = data.date.toDate();
        let scheduledTime: Date = scheduledDate;
        const timeStr: string | undefined = data.time;
        if (typeof timeStr === 'string' && /^(\d{1,2}):(\d{2})$/.test(timeStr)) {
          const [h, m] = timeStr.split(':').map(Number);
          scheduledTime = new Date(scheduledDate);
          scheduledTime.setHours(h, m, 0, 0);
        }

        trips.push({
          id: docSnap.id,
          childName: data.childName,
          driverName,
          driverAvatar,
          from: data.from,
          to: data.to,
          scheduledTime,
          status: isActive ? 'in-progress' : 'programmed',
          transportType: data.transportType,
          distance: data.distance || 0,
        });
      }

      // Assurer l'inclusion du trajet actif, même s'il n'est pas dans les 5 premiers par date
      try {
        const activeRef = collection(db, 'activeMissions');
        const activeQueryRef2 = query(activeRef, where('status', 'in', ['started', 'in_progress']));
        const activeSnap2 = await getDocs(activeQueryRef2);

        for (const missionDoc of activeSnap2.docs) {
          const missionData = missionDoc.data() as any;
          const transportId: string | undefined = missionData.transportId;
          if (!transportId) continue;

          // Récupérer le transport lié et vérifier qu'il appartient au parent courant
          try {
            const transportDoc = await getDoc(doc(db, 'transports', transportId));
            if (!transportDoc.exists()) continue;
            const t = transportDoc.data() as any;
            if (t.userId !== user.id) continue;

            // Exclure si le transport est terminé ou annulé
            if (t.status === 'completed' || t.status === 'cancelled') {
              continue;
            }

            // Construire/mettre à jour le trip correspondant
            const scheduledDate: Date = t.date.toDate();
            let scheduledTime: Date = scheduledDate;
            const timeStr: string | undefined = t.time;
            if (typeof timeStr === 'string' && /^(\d{1,2}):(\d{2})$/.test(timeStr)) {
              const [h, m] = timeStr.split(':').map(Number);
              scheduledTime = new Date(scheduledDate);
              scheduledTime.setHours(h, m, 0, 0);
            }

            // Infos chauffeur si besoin
            let driverName = 'Chauffeur assigné';
            let driverAvatar: string | undefined = undefined;
            if (t.driverId) {
              try {
                const driverDoc = await getDoc(doc(db, 'users', t.driverId));
                if (driverDoc.exists()) {
                  const driverData = driverDoc.data();
                  driverName = driverData.displayName || 'Chauffeur assigné';
                  driverAvatar = driverData.avatar;
                }
              } catch {}
            }

            const existingIdx = trips.findIndex(tr => tr.id === transportDoc.id);
            const tripItem: UpcomingTrip = {
              id: transportDoc.id,
              childName: t.childName,
              driverName,
              driverAvatar,
              from: t.from,
              to: t.to,
              scheduledTime,
              status: 'in-progress',
              transportType: t.transportType,
              distance: t.distance || 0,
            };

            if (existingIdx >= 0) {
              trips[existingIdx] = tripItem;
            } else {
              // Mettre le trajet actif en tête
              trips.unshift(tripItem);
            }
          } catch (e) {
            console.error('Erreur lors de la consolidation du trajet actif:', e);
          }
        }
      } catch (e) {
        console.error('Erreur lors de l\'inclusion du trajet actif:', e);
      }

      // Déduplication et limite à 5 éléments
      const unique = new Map<string, UpcomingTrip>();
      for (const t of trips) unique.set(t.id, t);
      const finalTrips = Array.from(unique.values()).slice(0, 5);

      setUpcomingTrips(finalTrips);
    } catch (error) {
      console.error('Erreur lors du chargement des prochains trajets:', error);
    }
  }, [user?.id]);

  // Charger le planning de la semaine
  const loadWeeklySchedule = useCallback(async () => {
    if (!user?.id) return;

    try {
      const transportsRef = collection(db, 'transports');
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weekQuery = query(
        transportsRef,
        where('userId', '==', user.id),
        where('date', '>=', Timestamp.fromDate(startOfWeek)),
        where('date', '<=', Timestamp.fromDate(endOfWeek)),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(weekQuery);
      const scheduleMap = new Map<string, WeeklySchedule>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.date.toDate();
        const dateKey = date.toDateString();

        if (!scheduleMap.has(dateKey)) {
          scheduleMap.set(dateKey, {
            date,
            trips: [],
          });
        }

        scheduleMap.get(dateKey)!.trips.push({
          id: doc.id,
          childName: data.childName,
          time: data.time,
          type: data.transportType === 'aller-retour' ? 'aller' : data.transportType,
          status: data.status || 'programmed', // Utiliser le vrai statut de la DB
          from: data.from || { address: 'Adresse de départ', lat: 0, lng: 0 },
          to: data.to || { address: 'Adresse d\'arrivée', lat: 0, lng: 0 },
        });
      });

      setWeeklySchedule(Array.from(scheduleMap.values()));
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
    }
  }, [user?.id]);

  // Fonction pour calculer les statistiques dynamiques d'un enfant
  const calculateChildStats = async (childId: string, parentId: string) => {
    try {
      const transportsRef = collection(db, 'transports');
      const reviewsRef = collection(db, 'reviews');
      
      // Récupérer tous les transports de l'enfant
      const childTransportsQuery = query(
        transportsRef,
        where('userId', '==', parentId),
        where('childId', '==', childId)
      );
      const transportsSnapshot = await getDocs(childTransportsQuery);
      
      let totalTrips = 0;
      let completedTrips = 0;
      let cancelledTrips = 0;
      let lastTripDate: Date | null = null;
      let nextTransportDate: Date | null = null;
      
      const now = new Date();
      
      transportsSnapshot.forEach((doc) => {
        const transport = doc.data();
        const transportDate = transport.date.toDate();
        
        totalTrips++;
        
        // Compter par statut
        if (transport.status === 'completed') {
          completedTrips++;
          
          // Mettre à jour la date du dernier trajet
          if (!lastTripDate || transportDate > lastTripDate) {
            lastTripDate = transportDate;
          }
        } else if (transport.status === 'cancelled') {
          cancelledTrips++;
        }
        
        // Trouver le prochain transport
        if (transportDate > now && (!nextTransportDate || transportDate < nextTransportDate)) {
          nextTransportDate = transportDate;
        }
      });
      
      // Récupérer les évaluations pour calculer la note moyenne
      const childReviewsQuery = query(
        reviewsRef,
        where('childId', '==', childId)
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
      
      const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '5.0';
      
      // Préparer les informations du prochain transport
      let nextTransport = null;
      if (nextTransportDate) {
        const nextTransportDoc = transportsSnapshot.docs.find(doc => {
          const transport = doc.data();
          return transport.date.toDate().getTime() === nextTransportDate!.getTime();
        });
        
        if (nextTransportDoc) {
          const transport = nextTransportDoc.data();
          nextTransport = {
            date: (nextTransportDate as Date).toLocaleDateString('fr-FR'),
            time: transport.time,
            type: transport.transportType,
          };
        }
      }
      
      return {
        totalTrips,
        completedTrips,
        cancelledTrips,
        lastTrip: lastTripDate || undefined,
        nextTransport,
        averageRating,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques de l\'enfant:', error);
      return {
        totalTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        lastTrip: undefined,
        nextTransport: null,
        averageRating: '5.0',
      };
    }
  };

  // Charger les profils des enfants
  const loadChildren = useCallback(async () => {
    if (!user?.id) return;

    try {
      const childrenRef = collection(db, 'children');
      const childrenQuery = query(childrenRef, where('parentId', '==', user.id));
      const snapshot = await getDocs(childrenQuery);

      const childrenProfiles: ChildProfile[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Calculer les statistiques dynamiques de l'enfant
        const stats = await calculateChildStats(docSnap.id, user.id);

        childrenProfiles.push({
          id: docSnap.id,
          name: data.name,
          age: data.age || 0,
          avatar: data.avatar,
          school: data.school || 'École non renseignée',
          grade: data.grade || 'Classe non renseignée',
          totalTrips: stats.totalTrips,
          lastTrip: stats.lastTrip,
          personality: data.personality || '', // ✅ Ajout de la personnalité
          needs: data.needs || [], // ✅ Ajout des besoins spécifiques
          preferences: data.preferences,
        });
      }

      setChildren(childrenProfiles);
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
    }
  }, [user?.id]);

  // Charger les évaluations
  const loadReviews = useCallback(async () => {
    if (!user?.id) return;

    try {
      const reviewsRef = collection(db, 'reviews');
      
      // Évaluations reçues (en tant que parent)
      const receivedQuery = query(
        reviewsRef,
        where('parentId', '==', user.id),
        where('type', '==', 'received'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      // Évaluations données (par le parent)
      const givenQuery = query(
        reviewsRef,
        where('userId', '==', user.id),
        where('type', '==', 'given'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const [receivedSnapshot, givenSnapshot] = await Promise.all([
        getDocs(receivedQuery),
        getDocs(givenQuery)
      ]);

      const allReviews: Review[] = [];

      // Traiter les évaluations reçues
      receivedSnapshot.forEach((doc) => {
        const data = doc.data();
        allReviews.push({
          id: doc.id,
          type: 'received',
          reviewerName: data.reviewerName || 'Utilisateur',
          reviewerAvatar: data.reviewerAvatar,
          reviewerRole: data.reviewerRole || 'driver',
          rating: data.rating || 5,
          comment: data.comment || '',
          date: data.createdAt?.toDate() || new Date(),
          tripType: data.tripType || 'aller',
          childName: data.childName,
          canReply: true,
          hasReplied: data.hasReplied || false,
        });
      });

      // Traiter les évaluations données avec récupération du nom du destinataire
      const givenReviewsPromises = givenSnapshot.docs.map(async (reviewDoc) => {
        const data = reviewDoc.data();
        
        // Récupérer le nom du chauffeur (destinataire)
        let recipientName = 'Chauffeur';
        if (data.driverId) {
          try {
            const driverDoc = await getDoc(doc(db, 'users', data.driverId));
            if (driverDoc.exists()) {
              recipientName = driverDoc.data().firstName + ' ' + driverDoc.data().lastName || 'Chauffeur';
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du nom du chauffeur:', error);
          }
        }
        
        return {
          id: reviewDoc.id,
          type: 'given' as const,
          reviewerName: (user as any).firstName && (user as any).lastName 
            ? (user as any).firstName + ' ' + (user as any).lastName 
            : (user as any).displayName || 'Vous',
          reviewerAvatar: user.avatar,
          reviewerRole: 'parent' as const,
          rating: data.rating || 5,
          comment: data.comment || '',
          date: data.createdAt?.toDate() || new Date(),
          tripType: data.tripType || 'aller',
          childName: data.childName,
          canReply: false,
          hasReplied: false,
          recipientName: recipientName,
        };
      });
      
      const givenReviews = await Promise.all(givenReviewsPromises);
      allReviews.push(...givenReviews);

      // Trier par date
      allReviews.sort((a, b) => b.date.getTime() - a.date.getTime());
      setReviews(allReviews);
    } catch (error) {
      console.error('Erreur lors du chargement des évaluations:', error);
    }
  }, [user?.id, user?.name, user?.avatar]);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(notificationsQuery);
      const userNotifications: Notification[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        userNotifications.push({
          id: doc.id,
          type: data.type || 'trip_started',
          title: data.title || 'Notification',
          message: data.message || '',
          date: data.createdAt?.toDate() || new Date(),
          read: data.read || false,
          actionUrl: data.actionUrl,
          priority: data.priority || 'medium',
        });
      });

      setNotifications(userNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  }, [user?.id]);

  // Charger toutes les données du dashboard
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadStats(),
        loadUpcomingTrips(),
        loadWeeklySchedule(),
        loadChildren(),
        loadReviews(),
        loadNotifications(),
      ]);
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
  }, [user?.id, loadStats, loadUpcomingTrips, loadWeeklySchedule, loadChildren, loadReviews, loadNotifications, toast]);

  // Marquer une notification comme lue
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
    }
  }, []);

  // Obtenir le prochain trajet
  const getNextTrip = useCallback(() => {
    // Ne retourner qu'un trajet réellement en cours
    const active = upcomingTrips.find(t => t.status === 'in-progress');
    return active || null;
  }, [upcomingTrips]);

  // Obtenir l'enfant vedette (celui avec le plus de trajets)
  const getFeaturedChild = useCallback(() => {
    if (children.length === 0) return null;
    return children.reduce((prev, current) => 
      current.totalTrips > prev.totalTrips ? current : prev
    );
  }, [children]);

  // Obtenir les notifications non lues
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notif => !notif.read);
  }, [notifications]);

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, loadDashboardData]);

  // Écouter les changements en temps réel pour les trajets actifs
  useEffect(() => {
    if (!user?.id) return;

    const activeMissionsRef = collection(db, 'activeMissions');
    const activeMissionsQuery = query(
      activeMissionsRef,
      where('driverId', '==', user.id)
    );

    const unsubscribe = onSnapshot(activeMissionsQuery, (snapshot) => {
      // Mettre à jour les trajets actifs en temps réel
      loadUpcomingTrips();
    });

    return () => unsubscribe();
  }, [user?.id, loadUpcomingTrips]);

  return {
    // Données
    stats,
    upcomingTrips,
    weeklySchedule,
    children,
    reviews,
    notifications,
    
    // États
    loading,
    error,
    
    // Actions
    loadDashboardData,
    markNotificationAsRead,
    
    // Getters
    getNextTrip,
    getFeaturedChild,
    getUnreadNotifications,
  };
}
