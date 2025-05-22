import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useAuth } from '@/lib/auth/auth-context';

export interface Region {
  id: string;
  name: string;
  driverId: string; // Chauffeur assigné à la région
}

// Liste complète des régions de France métropolitaine et d'outre-mer
const FRENCH_REGIONS = [
  { name: 'Auvergne-Rhône-Alpes' },
  { name: 'Bourgogne-Franche-Comté' },
  { name: 'Bretagne' },
  { name: 'Centre-Val de Loire' },
  { name: 'Corse' },
  { name: 'Grand Est' },
  { name: 'Hauts-de-France' },
  { name: 'Île-de-France' },
  { name: 'Normandie' },
  { name: 'Nouvelle-Aquitaine' },
  { name: 'Occitanie' },
  { name: 'Pays de la Loire' },
  { name: 'Provence-Alpes-Côte d\'Azur' },
  { name: 'Guadeloupe' },
  { name: 'Martinique' },
  { name: 'Guyane' },
  { name: 'La Réunion' },
  { name: 'Mayotte' }
];

// Fonction à exécuter une seule fois pour remplir la collection 'regions'
export async function insertAllFrenchRegions() {
  try {
    const regionsRef = collection(db, 'regions');
    for (const region of FRENCH_REGIONS) {
      await addDoc(regionsRef, {
        name: region.name,
        driverId: '', // à compléter plus tard
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'insertion des régions :', error);
    return { success: false, error };
  }
}

export function useRegion() {
  const { user } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Charger toutes les régions
  const loadRegions = useCallback(async () => {
    setLoading(true);
    try {
      const regionsRef = collection(db, 'regions');
      const snapshot = await getDocs(regionsRef);
      const regionsList: Region[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Region);
      setRegions(regionsList);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger la région de l'utilisateur
  const loadUserRegion = useCallback(async () => {
    if (!user?.id) return;
    const userRef = doc(db, 'users', user.id);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    if (userData?.regionId) {
      const regionRef = doc(db, 'regions', userData.regionId);
      const regionSnap = await getDoc(regionRef);
      if (regionSnap.exists()) {
        setUserRegion({ id: regionSnap.id, ...regionSnap.data() } as Region);
        setDialogOpen(false);
        return;
      }
    }
    setUserRegion(null);
    setDialogOpen(true); // Ouvre le dialogue si pas de région
  }, [user?.id]);

  // Définir la région de l'utilisateur
  const setRegionForUser = useCallback(async (regionId: string) => {
    if (!user?.id) return;
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, { regionId });
    await loadUserRegion();
  }, [user?.id, loadUserRegion]);

  useEffect(() => {
    loadRegions();
    loadUserRegion();
  }, [loadRegions, loadUserRegion]);

  return {
    regions,
    userRegion,
    loading,
    dialogOpen,
    setDialogOpen,
    setRegionForUser,
    reload: () => {
      loadRegions();
      loadUserRegion();
    }
  };
}
