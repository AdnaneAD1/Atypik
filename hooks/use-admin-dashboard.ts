"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/ClientApp';
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

export interface AdminDashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  pendingDrivers: number;
  transportsToday: number;
  transportsInProgress: number;
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const endOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const startOfMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Users total
      const usersRef = collection(db, 'users');
      const usersAgg = await getCountFromServer(usersRef);
      const totalUsers = usersAgg.data().count || 0;

      // New users this month
      const usersThisMonthQ = query(
        usersRef,
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
      );
      const usersThisMonthAgg = await getCountFromServer(usersThisMonthQ);
      const newUsersThisMonth = usersThisMonthAgg.data().count || 0;

      // Pending drivers
      const pendingDriversQ = query(usersRef, where('role', '==', 'driver'), where('status', '==', 'pending'));
      const pendingDriversAgg = await getCountFromServer(pendingDriversQ);
      const pendingDrivers = pendingDriversAgg.data().count || 0;

      // Transports today
      const transportsRef = collection(db, 'transports');
      const transportsTodayQ = query(
        transportsRef,
        where('date', '>=', Timestamp.fromDate(startOfToday)),
        where('date', '<=', Timestamp.fromDate(endOfToday))
      );
      const transportsTodayAgg = await getCountFromServer(transportsTodayQ);
      const transportsToday = transportsTodayAgg.data().count || 0;

      // Transports in progress (active missions)
      const activeRef = collection(db, 'activeMissions');
      // Firestore 'in' requires <= 10; here we use two values
      const activeQ = query(activeRef, where('status', 'in', ['started', 'in_progress']));
      const activeAgg = await getCountFromServer(activeQ);
      const transportsInProgress = activeAgg.data().count || 0;

      setStats({
        totalUsers,
        newUsersThisMonth,
        pendingDrivers,
        transportsToday,
        transportsInProgress,
      });
    } catch (e: any) {
      console.error('useAdminDashboard load error', e);
      setError(e?.message || 'Erreur de chargement des statistiques');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [startOfMonth, startOfToday, endOfToday]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
