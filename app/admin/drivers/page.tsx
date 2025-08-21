"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/use-admin';
import { ShieldCheck, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/firebase/ClientApp';
import { Timestamp, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export default function AdminDriversPage() {
  const { drivers, loading, error, loadUsers, approveDriver } = useAdmin();
  const [openDriverId, setOpenDriverId] = useState<string | null>(null);
  const [monthStats, setMonthStats] = useState<{ missions: number; revenue: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);

  useEffect(() => { loadUsers('driver'); }, []);

  const monthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return {
      startTs: Timestamp.fromDate(start),
      endTs: Timestamp.fromDate(next),
    };
  }, []);

  useEffect(() => {
    const fetchDriverMonthStats = async (driverId: string) => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        // Resolve region name for the driver (if any)
        const driver = drivers.find((u) => u.id === driverId);
        setRegionName(null);
        if (driver?.regionId) {
          try {
            const regionRef = doc(collection(db, 'regions'), driver.regionId);
            const regionDoc = await getDoc(regionRef);
            if (regionDoc.exists()) setRegionName((regionDoc.data() as any).name || '—');
          } catch (_) {
            setRegionName(null);
          }
        }

        // Count missions in transports for current month
        const transportsRef = collection(db, 'transports');
        const tq = query(
          transportsRef,
          where('driverId', '==', driverId),
          where('date', '>=', monthRange.startTs),
          where('date', '<', monthRange.endTs)
        );
        const transportSnap = await getDocs(tq);
        const missions = transportSnap.size;

        // Sum gains in gains collection for current month
        const gainsRef = collection(db, 'gains');
        const gq = query(
          gainsRef,
          where('driverId', '==', driverId),
          where('createdAt', '>=', monthRange.startTs),
          where('createdAt', '<', monthRange.endTs)
        );
        const gainsSnap = await getDocs(gq);
        let revenue = 0;
        gainsSnap.forEach((doc) => {
          const data = doc.data() as any;
          const amt = typeof data.amount === 'number' ? data.amount : 0;
          revenue += amt;
        });

        setMonthStats({ missions, revenue });
      } catch (e) {
        console.error('Erreur chargement stats chauffeur:', e);
        setStatsError('Impossible de charger les statistiques du mois');
      } finally {
        setStatsLoading(false);
      }
    };

    if (openDriverId) {
      fetchDriverMonthStats(openDriverId);
    } else {
      setMonthStats(null);
      setStatsError(null);
      setRegionName(null);
    }
  }, [openDriverId, monthRange.startTs, monthRange.endTs, drivers]);

  return (
    <AppLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chauffeurs</h1>
          <p className="text-sm text-muted-foreground">Listing et validation des comptes chauffeurs</p>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chauffeurs ({drivers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : drivers.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun chauffeur trouvé.</div>
            ) : (
              <div className="space-y-3">
                {drivers.map((d) => (
                  <div key={d.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {d.displayName || d.email || d.id}
                        <Badge variant={(d.status === 'verified' ? 'default' : 'outline') as any}>
                          {d.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{d.email || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" className="gap-2" onClick={() => setOpenDriverId(d.id)}>
                        <Info className="h-4 w-4" /> Détails
                      </Button>
                      {d.status !== 'verified' && (
                        <Button size="sm" className="gap-2" onClick={() => approveDriver(d.id)}>
                          <ShieldCheck className="h-4 w-4" /> Valider
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!openDriverId} onOpenChange={(o) => !o && setOpenDriverId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du chauffeur</DialogTitle>
            <DialogDescription>Profil et statistiques du mois en cours</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const d = drivers.find((u) => u.id === openDriverId);
              const name = d?.displayName || d?.email || d?.id || 'Chauffeur';
              const initials = name?.split(' ').map((p) => p[0]).join('').slice(0,2).toUpperCase() || 'CH';
              return (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={d?.avatar} alt={name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{d?.email || '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      Région: <span className="font-medium">{regionName || '—'}</span>
                    </div>
                    {d?.status && (
                      <div className="text-xs text-muted-foreground">Statut: <span className="font-medium">{d.status}</span></div>
                    )}
                    {(d as any)?.phone && (
                      <div className="text-xs text-muted-foreground">Téléphone: <span className="font-medium">{(d as any).phone}</span></div>
                    )}
                  </div>
                </div>
              );
            })()}

            {statsLoading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : statsError ? (
              <div className="text-sm text-destructive">{statsError}</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Missions du mois</span>
                  <span className="text-sm font-semibold">{monthStats?.missions ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenu perçu</span>
                  <span className="text-sm font-semibold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(monthStats?.revenue ?? 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
