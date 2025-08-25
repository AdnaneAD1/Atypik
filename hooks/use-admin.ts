import { useMemo, useState } from 'react';
import { db } from '@/firebase/ClientApp';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore';

export type AdminUserRole = 'parent' | 'driver' | 'admin';

export interface AdminUser {
  id: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  role: AdminUserRole;
  status?: string; // e.g., 'pending' | 'verified' for drivers
  regionId?: string;
  selectedDriverId?: string;
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

    // Best-effort: envoyer un email d'information au chauffeur (template brandé)
    try {
      const snap = await getDoc(doc(db, 'users', driverId));
      if (snap.exists()) {
        const data = snap.data() as any;
        const email: string | undefined = data?.email;
        const name: string = data?.displayName || data?.name || 'Chauffeur';
        if (email) {
          const subject = 'Atypik Driver • Votre compte a été validé';
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject,
              template: 'accountApproved',
              variables: { name },
            }),
          });
        }
      }
    } catch (e) {
      console.error('Erreur lors de l\'envoi de l\'email de validation chauffeur:', e);
    }
  };

  const assignDriverToParent = async (parentId: string, driverId: string) => {
    await updateDoc(doc(db, 'users', parentId), { selectedDriverId: driverId });
    setUsers((prev) => prev.map((u) => (u.id === parentId ? { ...u, selectedDriverId: driverId } : u)));
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
