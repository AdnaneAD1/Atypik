import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { Timestamp } from 'firebase/firestore';

export interface Mission {
  id: string;
  driverId: string;
  date: Timestamp;
  status: 'pending' | 'in_progress' | 'done';
  child: { name: string; age: number; needs: string[] };
  from: { name: string; address: string };
  to: { name: string; address: string };
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
      // Pour chaque transport, on va enrichir les infos de l'enfant
const getChildInfo = async (childId: string) => {
  if (!childId) return { age: null, needs: [] };
  try {
    const childSnap = await getDocs(query(collection(db, 'children'), where('__name__', '==', childId)));
    if (!childSnap.empty) {
      const childData = childSnap.docs[0].data();
      return {
        age: childData.age ?? null,
        needs: childData.needs ?? []
      };
    }
  } catch (e) {
    // ignore
  }
  return { age: null, needs: [] };
};

const missionsPromises = snapshot.docs.map(async doc => {
  const data = doc.data();
  const dateObj = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
  // Format HH:mm
  const pad = (n: number) => n.toString().padStart(2, '0');
  const time = data.time || `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  // Statut par défaut (à améliorer si besoin)
  let status: 'pending' | 'in_progress' | 'done' = 'pending';
  // Récupérer infos enfant
  const childInfo = await getChildInfo(data.childId);
  const child = {
    name: data.childName || 'Enfant',
    age: childInfo.age,
    needs: childInfo.needs
  };
  // Construction des lieux (à compléter si tu as plus d'infos)
  const from = {
    name: data.fromName || 'Départ',
    address: data.fromAddress || ''
  };
  const to = {
    name: data.toName || 'Arrivée',
    address: data.toAddress || ''
  };
  return {
    id: doc.id,
    driverId: data.userId,
    date: data.date,
    status,
    child,
    from,
    to,
    time
  };
});
const result: Mission[] = await Promise.all(missionsPromises);
setMissions(result);
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
