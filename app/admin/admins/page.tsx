"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/hooks/use-admin';
import { UserPlus, Copy } from 'lucide-react';
import { auth } from '@/firebase/ClientApp';

export default function AdminAdminsPage() {
  const { admins, loading, error, loadUsers } = useAdmin();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => { loadUsers('admin'); }, []);

  const handleCreate = async () => {
    if (!email) return;
    setCreating(true);
    setCreatedInfo(null);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      if (!token) throw new Error('Token invalide');
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Échec de création');
      setCreatedInfo({ email: data.email, password: data.password });
      setEmail('');
      setDisplayName('');
      await loadUsers('admin');
    } catch (e: any) {
      console.error('create admin error', e);
      alert(e?.message || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const copyPassword = async () => {
    if (!createdInfo?.password) return;
    try {
      await navigator.clipboard.writeText(createdInfo.password);
    } catch {}
  };

  return (
    <AppLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administrateurs</h1>
          <p className="text-sm text-muted-foreground">Créer un compte admin par email (un mot de passe fort est généré automatiquement)</p>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Créer un administrateur</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="col-span-1 sm:col-span-1">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="text-sm font-medium">Nom (optionnel)</label>
              <Input placeholder="Nom complet" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="col-span-1 sm:col-span-1">
              <Button onClick={handleCreate} disabled={!email || creating} className="w-full sm:w-auto gap-2">
                <UserPlus className="h-4 w-4" /> Créer l'admin
              </Button>
            </div>
            {createdInfo && (
              <div className="sm:col-span-3 border rounded-lg p-3 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-sm">Admin créé pour <span className="font-medium">{createdInfo.email}</span></div>
                <div className="text-sm mt-2 flex items-center gap-2">
                  <span>Mot de passe:</span>
                  <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border text-xs">{createdInfo.password}</code>
                  <Button size="sm" variant="outline" className="h-7 px-2 gap-2" onClick={copyPassword}>
                    <Copy className="h-3.5 w-3.5" /> Copier
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Liste des admins ({admins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : admins.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun administrateur.</div>
            ) : (
              <div className="space-y-3">
                {admins.map((a) => (
                  <div key={a.id} className="border rounded-lg p-3">
                    <div className="font-medium">{a.displayName || a.email || a.id}</div>
                    <div className="text-xs text-muted-foreground">{a.email || '—'}</div>
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
