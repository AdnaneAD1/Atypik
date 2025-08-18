import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { Timestamp } from 'firebase/firestore';

export interface Mission {
  id: string;
  driverId: string;
  date: Timestamp;
  status: 'programmed' | 'in_progress' | 'completed';
  child: { name: string; age: number; needs: string[]; personality?: string };
  parent: { name: string; phone?: string }; // Ajouter les informations du parent
  from: { name: string; address: string; lat: number; lng: number };
  to: { name: string; address: string; lat: number; lng: number };
  time: string;
  distance: number; // Distance en mètres
}

interface UseMissionsResult {
  missions: Mission[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Helper pour formater la date du jour en début et fin de journée
const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
  };
};

export function useMissions(driverId: string): UseMissionsResult {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getTodayRange();
      const transportsRef = collection(db, 'transports');
      const q = query(
        transportsRef,
        where('driverId', '==', driverId),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      // Pour chaque transport, on va enrichir les infos de l'enfant et du parent
const getChildInfo = async (childId: string) => {
  if (!childId) return { age: null, needs: [], personality: null };
  try {
    const childSnap = await getDocs(query(collection(db, 'children'), where('__name__', '==', childId)));
    if (!childSnap.empty) {
      const childData = childSnap.docs[0].data();
      return {
        age: childData.age ?? null,
        needs: childData.needs ?? [],
        personality: childData.personality ?? null
      };
    }
  } catch (e) {
    // ignore
  }
  return { age: null, needs: [], personality: null };
};

const getParentInfo = async (parentId: string) => {
  if (!parentId) return { name: 'Parent inconnu', phone: undefined };
  try {
    const userDocRef = doc(db, 'users', parentId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        name: userData.displayName || userData.name || userData.email || 'Parent',
        phone: userData.phone
      };
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du parent:', e);
  }
  return { name: 'Parent inconnu', phone: undefined };
};

// Filtrer les transports annulés avant de traiter les données
const filteredDocs = snapshot.docs.filter(doc => {
  const data = doc.data();
  return data.status !== 'cancelled'; // Exclure les transports annulés
});

const missionsPromises = filteredDocs.map(async doc => {
  const data = doc.data();
  const dateObj = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
  // Format HH:mm
  const pad = (n: number) => n.toString().padStart(2, '0');
  const time = data.time || `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  // Normaliser le statut depuis Firestore vers l'enum interne
  const rawStatus = (data.status || '').toString();
  let status: 'programmed' | 'in_progress' | 'completed';
  switch (rawStatus) {
    case 'programmed':
    case 'pending':
    case 'scheduled':
      status = 'programmed';
      break;
    case 'in-progress':
    case 'in_progress':
    case 'started':
      status = 'in_progress';
      break;
    case 'completed':
    case 'done':
      status = 'completed';
      break;
    default:
      status = 'programmed';
  }
  // Récupérer infos enfant et parent
  const childInfo = await getChildInfo(data.childId);
  const parentInfo = await getParentInfo(data.userId); // userId est l'ID du parent
  const child = {
    name: data.childName || 'Enfant',
    age: childInfo.age,
    needs: childInfo.needs,
    personality: childInfo.personality
  };
  const parent = {
    name: parentInfo.name,
    phone: parentInfo.phone
  };
  // Construction des lieux (utiliser les bons attributs depuis Firestore)
  const from = {
    name: data.from?.address?.split(',')[0] || 'Départ', // Premier élément de l'adresse comme nom
    address: data.from?.address || '',
    lat: data.from?.lat || 0,
    lng: data.from?.lng || 0
  };
  const to = {
    name: data.to?.address?.split(',')[0] || 'Arrivée', // Premier élément de l'adresse comme nom
    address: data.to?.address || '',
    lat: data.to?.lat || 0,
    lng: data.to?.lng || 0
  };
  return {
    id: doc.id,
    driverId: data.driverId, // Utiliser data.driverId au lieu de data.userId
    date: data.date,
    status,
    child,
    parent, // Ajouter les informations du parent
    from,
    to,
    time,
    distance: data.distance || 0 // Ajouter la distance
  };
});
const result: Mission[] = await Promise.all(missionsPromises);

// Trier les missions par heure croissante
const sortedResult = result.sort((a, b) => {
  // Convertir les heures au format HH:mm en minutes pour comparaison
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  return timeToMinutes(a.time) - timeToMinutes(b.time);
});

setMissions(sortedResult);
    } catch (err: any) {
      setError('Erreur lors du chargement des missions' + err);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (driverId) fetchMissions();
  }, [driverId, fetchMissions]);

  return { missions, loading, error, refresh: fetchMissions };
}
