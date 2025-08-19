"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/hooks/use-admin';

export default function AdminAssignmentsPage() {
  const { parents, drivers, loading, error, loadUsers, assignDriverToParent } = useAdmin();
  const [assignments, setAssignments] = useState<Record<string,string>>({});

  useEffect(() => { loadUsers(); }, []);

  const orderedParents = useMemo(() => parents, [parents]);

  // Prefill current selected driver per parent when data loads (only if driver is in same region and verified)
  useEffect(() => {
    if (!parents || parents.length === 0) return;
    setAssignments((prev) => {
      const next = { ...prev } as Record<string, string>;
      parents.forEach((p: any) => {
        const validRegionalDriver = drivers.find(
          (d: any) =>
            d.id === p?.selectedDriverId &&
            d?.regionId &&
            d.regionId === p?.regionId &&
            d?.status === 'verified'
        );
        // If a regional selected driver exists and we haven't set a value yet, prefill it
        if (validRegionalDriver && !next[p.id]) {
          next[p.id] = validRegionalDriver.id as string;
        }
        // If an existing assignment is not valid for the region, clear it
        if (
          next[p.id] &&
          !drivers.find(
            (d: any) => d.id === next[p.id] && d?.regionId === p?.regionId && d?.status === 'verified'
          )
        ) {
          delete next[p.id];
        }
      });
      return next;
    });
  }, [parents, drivers]);

  const handleAssign = async (parentId: string) => {
    const driverId = assignments[parentId];
    if (!driverId) return;
    await assignDriverToParent(parentId, driverId);
  };

  return (
    <AppLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assignations</h1>
          <p className="text-sm text-muted-foreground">Assigner un chauffeur à un parent</p>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Parents ({orderedParents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : orderedParents.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun parent trouvé.</div>
            ) : (
              <div className="space-y-3">
                {orderedParents.map((p) => (
                  <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.displayName || p.email || p.id}</div>
                      <div className="text-xs text-muted-foreground">{p.email || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const regionalDrivers = drivers.filter(
                          (d: any) => d?.regionId && d.regionId === p?.regionId && d?.status === 'verified'
                        );
                        const disabled = regionalDrivers.length === 0;
                        return (
                          <>
                            <Select
                              value={assignments[p.id] || ''}
                              onValueChange={(v) => setAssignments((prev) => ({ ...prev, [p.id]: v }))}
                              disabled={disabled}
                            >
                              <SelectTrigger className="w-56">
                                <SelectValue placeholder={disabled ? 'Aucun chauffeur disponible' : 'Choisir un chauffeur'} />
                              </SelectTrigger>
                              <SelectContent>
                                {regionalDrivers.map((d: any) => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.displayName || d.email || d.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              onClick={() => handleAssign(p.id)}
                              disabled={disabled || !assignments[p.id]}
                            >
                              Assigner
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
