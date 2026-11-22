import { useMemo, useState } from 'react';
import { db } from '@/firebase/ClientApp';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { authFetch } from '@/lib/api/auth-fetch';

export type AdminUserRole = 'parent' | 'driver' | 'admin';

export interface AdminUser {
  id: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  role: AdminUserRole;
  status?: string; // e.g., 'pending' | 'verified' for drivers
  regionId?: string;
  selectedDriverId?: string | null;
  createdAt?: any;
}

export function useAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async (roleFilter?: AdminUserRole) => {
    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(db, 'users');
      const q = roleFilter
        ? query(usersRef, where('role', '==', roleFilter), orderBy('createdAt', 'desc'))
        : query(usersRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: AdminUser[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setUsers(list);
      return list;
    } catch (e: any) {
      console.error('loadUsers error', e);
      setError(e?.message || 'Erreur de chargement des utilisateurs');
      return [] as AdminUser[];
    } finally {
      setLoading(false);
    }
  };

  const approveDriver = async (driverId: string) => {
    await updateDoc(doc(db, 'users', driverId), { status: 'verified' });
    setUsers((prev) => prev.map((u) => (u.id === driverId ? { ...u, status: 'verified' } : u)));

    // Notifie le chauffeur : in-app + push + e-mail brandé « compte validé »
    // (la route /api/notifications/send choisit le template accountApproved pour ce type)
    try {
      await authFetch('/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          userId: driverId,
          title: 'Votre compte chauffeur est validé',
          body: 'Bonne nouvelle : votre dossier a été validé par nos équipes. Vous pouvez vous connecter et recevoir vos missions.',
          clickAction: '/driver/dashboard',
          data: { type: 'driverApproved' },
        }),
      });
    } catch (e) {
      console.error('Erreur lors de la notification de validation chauffeur:', e);
    }
  };

  const assignDriverToParent = async (parentId: string, driverId: string | null) => {
    await updateDoc(doc(db, 'users', parentId), { selectedDriverId: driverId });
    setUsers((prev) => prev.map((u) => (u.id === parentId ? { ...u, selectedDriverId: driverId } : u)));

    // Notifie le parent lorsqu'un chauffeur lui est assigné (in-app + push + e-mail)
    if (driverId) {
      try {
        const driver = users.find((u) => u.id === driverId);
        const driverName = driver?.displayName || 'votre chauffeur';
        await authFetch('/api/notifications/send', {
          method: 'POST',
          body: JSON.stringify({
            userId: parentId,
            title: 'Votre chauffeur vous a été assigné',
            body: `${driverName} sera votre chauffeur Atypik. Vous pouvez dès maintenant programmer vos transports.`,
            clickAction: '/parent/calendar',
            data: { type: 'driverAssigned', driverId },
          }),
        });
      } catch (e) {
        console.error('Erreur lors de la notification d\'attribution chauffeur:', e);
      }
    }
  };

  const promoteToAdmin = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), { role: 'admin' });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: 'admin' } : u)));
  };

  const parents = useMemo(() => users.filter((u) => u.role === 'parent'), [users]);
  const drivers = useMemo(() => users.filter((u) => u.role === 'driver'), [users]);
  const admins = useMemo(() => users.filter((u) => u.role === 'admin'), [users]);

  return {
    users,
    parents,
    drivers,
    admins,
    loading,
    error,
    loadUsers,
    approveDriver,
    assignDriverToParent,
    promoteToAdmin,
  };
}
