"use client";
import { useState } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShieldCheck, CalendarRange, PlusCircle, RefreshCw } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase/ClientApp';
import { addDoc, collection } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const { stats, loading, error, reload } = useAdminDashboard();
  const { toast } = useToast();
  const [openNewRegion, setOpenNewRegion] = useState(false);
  const [regionName, setRegionName] = useState('');
  const [savingRegion, setSavingRegion] = useState(false);

  const handleSaveRegion = async () => {
    const name = regionName.trim();
    if (!name) {
      toast({ title: 'Nom requis', description: 'Veuillez entrer un nom de région.', variant: 'destructive' });
      return;
    }
    try {
      setSavingRegion(true);
      await addDoc(collection(db, 'regions'), { name, driverId: '' });
      toast({ title: 'Région créée', description: `“${name}” a été ajoutée.` });
      setRegionName('');
      setOpenNewRegion(false);
    } catch (e: any) {
      console.error('Erreur création région:', e);
      toast({ title: 'Erreur', description: e?.message || "Impossible d'enregistrer la région.", variant: 'destructive' });
    } finally {
      setSavingRegion(false);
    }
  };
  return (
    <AppLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Vue d&apos;ensemble du système et actions rapides</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={reload} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Dialog open={openNewRegion} onOpenChange={setOpenNewRegion}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Nouvelle région
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une région</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2 py-2">
                  <Label htmlFor="region-name">Nom de la région</Label>
                  <Input
                    id="region-name"
                    placeholder="Ex: Île-de-France"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    disabled={savingRegion}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNewRegion(false)} disabled={savingRegion}>Annuler</Button>
                  <Button onClick={handleSaveRegion} disabled={savingRegion}>
                    {savingRegion ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : stats?.totalUsers ?? 0}</div>
              <p className="text-xs text-muted-foreground">{loading ? 'Chargement…' : `+${stats?.newUsersThisMonth ?? 0} ce mois`}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Chauffeurs en attente</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : stats?.pendingDrivers ?? 0}</div>
              <p className="text-xs text-muted-foreground">À vérifier</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transports aujourd&apos;hui</CardTitle>
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : stats?.transportsToday ?? 0}</div>
              <p className="text-xs text-muted-foreground">{loading ? 'Chargement…' : `${stats?.transportsInProgress ?? 0} en cours`}</p>
            </CardContent>
          </Card>

          
        </div>

        {/* Recent activity / placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="rounded-xl lg:col-span-2">
            <CardHeader>
              <CardTitle>
                <span className="text-sm sm:text-base">Activité récente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Aucune donnée pour le moment. Cette section affichera les derniers événements (inscriptions, validations, incidents).</div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>
                <span className="text-sm sm:text-base">Tâches administrateur</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                <li>Vérifier 7 chauffeurs en attente</li>
                <li>Examiner 3 documents soumis</li>
                <li>Mettre à jour les régions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
