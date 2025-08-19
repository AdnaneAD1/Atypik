"use client";

import { useEffect } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/use-admin';
import { ShieldCheck } from 'lucide-react';

export default function AdminDriversPage() {
  const { drivers, loading, error, loadUsers, approveDriver } = useAdmin();

  useEffect(() => { loadUsers('driver'); }, []);

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
                    {d.status !== 'verified' && (
                      <Button size="sm" className="gap-2" onClick={() => approveDriver(d.id)}>
                        <ShieldCheck className="h-4 w-4" /> Valider
                      </Button>
                    )}
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
