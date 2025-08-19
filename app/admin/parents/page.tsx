"use client";

import { useEffect } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/hooks/use-admin';

export default function AdminParentsPage() {
  const { parents, loading, error, loadUsers } = useAdmin();

  useEffect(() => { loadUsers('parent'); }, []);

  return (
    <AppLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parents</h1>
          <p className="text-sm text-muted-foreground">Listing des profils parents</p>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Parents ({parents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : parents.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun parent trouvé.</div>
            ) : (
              <div className="space-y-3">
                {parents.map((p) => (
                  <div key={p.id} className="border rounded-lg p-3">
                    <div className="font-medium">{p.displayName || p.email || p.id}</div>
                    <div className="text-xs text-muted-foreground">{p.email || '—'}</div>
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
