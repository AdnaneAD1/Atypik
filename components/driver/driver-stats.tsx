'use client';

import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { CarLoader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useDriverStats } from '@/hooks/use-driver-stats';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { db } from '@/firebase/ClientApp';
import { Timestamp, collection, getDocs, query, where } from 'firebase/firestore';

export function DriverStats() {
  const { stats, loading, error, refreshStats } = useDriverStats();
  const { user } = useAuth();

  const [monthlyGains, setMonthlyGains] = useState<number | null>(null);
  const [gainsLoading, setGainsLoading] = useState<boolean>(false);
  const [gainsError, setGainsError] = useState<string | null>(null);

  const monthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return {
      startTs: Timestamp.fromDate(start),
      endTs: Timestamp.fromDate(nextMonth),
    };
  }, []);

  useEffect(() => {
    const fetchMonthlyGains = async () => {
      if (!user?.id) return;
      setGainsLoading(true);
      setGainsError(null);
      try {
        const gainsRef = collection(db, 'gains');
        const q = query(
          gainsRef,
          where('driverId', '==', user.id),
          where('createdAt', '>=', monthRange.startTs),
          where('createdAt', '<', monthRange.endTs)
        );
        const snap = await getDocs(q);
        let sum = 0;
        snap.forEach((doc) => {
          const data = doc.data() as any;
          const amt = typeof data.amount === 'number' ? data.amount : 0;
          sum += amt;
        });
        setMonthlyGains(sum);
      } catch (e) {
        console.error('Erreur chargement gains mensuels:', e);
        setGainsError('Impossible de charger les gains');
      } finally {
        setGainsLoading(false);
      }
    };

    fetchMonthlyGains();
  }, [user?.id, monthRange.startTs, monthRange.endTs]);

  // Affichage de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <CarLoader size={160} />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
          <Button onClick={refreshStats} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const maxWeekly = Math.max(...stats.weeklyActivity, 1);
  const todayIndex = (new Date().getDay() + 6) % 7;

  const completionRate = stats.totalMissions > 0
    ? Math.round((stats.completedMissions / stats.totalMissions) * 100)
    : 0;

  const Trend = ({ value }: { value: number }) => (
    <span className={cn('inline-flex items-center gap-1 font-bold', value >= 0 ? 'text-emerald-700' : 'text-primary')}>
      {value >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {value >= 0 ? '+' : ''}{value.toFixed(0).replace('-', '−')} %
    </span>
  );

  const statCards = [
    {
      label: 'Note moyenne',
      value: stats.averageRating.toFixed(1),
      unit: '/5',
      decimals: 1,
      sub: `Basé sur ${stats.totalReviews} évaluation${stats.totalReviews > 1 ? 's' : ''}`,
      tint: 'bg-brand-yellow/25',
    },
    {
      label: 'Missions du mois',
      value: stats.thisMonthMissions.toString(),
      decimals: 0,
      sub: <><Trend value={stats.trends.missionsGrowth} /> vs mois dernier</>,
      tint: 'bg-primary/10',
    },
    {
      label: 'Kilomètres parcourus',
      value: (stats.thisMonthKmTraveled || 0).toFixed(1),
      unit: 'km',
      decimals: 1,
      sub: <><Trend value={stats.trends.kmGrowth} /> vs mois dernier</>,
      tint: 'bg-brand-teal/10',
    },
    {
      label: 'Gains du mois',
      value: gainsLoading ? '0' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monthlyGains || 0),
      unit: '€',
      decimals: 2,
      sub: gainsError || 'Somme de vos gains ce mois-ci',
      tint: 'bg-brand-pink/10',
    },
  ];

  return (
    <div className="space-y-10">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Votre activité et vos performances
        </p>
      </div>

      {/* Chiffres — tuiles teintées façon dashboard */}
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((s, index) => (
          <div key={s.label} className={cn('rounded-xl p-5 sm:p-6', s.tint)}>
            <dt className="text-sm text-slate-600">{s.label}</dt>
            <dd className="mt-1.5 flex items-baseline gap-1.5 font-brand text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              <AnimatedCounter
                value={s.value}
                duration={1.5}
                delay={0.15 + index * 0.1}
                decimalPlaces={s.decimals}
              />
              {s.unit && (
                <span className="text-xl font-medium text-muted-foreground">{s.unit}</span>
              )}
            </dd>
            <dd className="mt-2 text-sm text-slate-600">{s.sub}</dd>
          </div>
        ))}
      </dl>

      {/* Activité + performance */}
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14">
        {/* Activité hebdomadaire */}
        <section className="border-t-2 border-slate-900 pt-6">
          <h2 className="font-brand text-2xl font-bold tracking-tight text-slate-900">
            Activité hebdomadaire
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Missions par jour</p>

          <div
            className="relative mt-7 grid h-64 grid-cols-7 items-end gap-2.5 border-b-2 border-slate-900 sm:h-72"
            role="img"
            aria-label={`Missions par jour cette semaine : ${days.map((d, i) => `${stats.weeklyActivity[i]} ${d}`).join(', ')}`}
          >
            {/* Ligne médiane en pointillés */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
            {stats.weeklyActivity.map((value, i) => {
              const isToday = i === todayIndex;
              return (
                <div key={days[i]} className="flex h-full flex-col justify-end">
                  <div
                    className={cn(
                      'w-full rounded-t transition-all duration-500',
                      isToday ? 'bg-primary' : 'bg-slate-200'
                    )}
                    style={{ height: value === 0 ? '6px' : `${(value / maxWeekly) * 100}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 grid grid-cols-7 gap-2.5 text-center" aria-hidden="true">
            {days.map((d, i) => {
              const isToday = i === todayIndex;
              return (
                <span key={d} className="grid gap-0.5">
                  <span className={cn('text-xs text-muted-foreground sm:text-sm', isToday && 'font-bold text-primary')}>
                    {d}
                  </span>
                  <b className={cn('font-brand text-base sm:text-lg', isToday ? 'text-primary' : 'text-muted-foreground')}>
                    {stats.weeklyActivity[i]}
                  </b>
                </span>
              );
            })}
          </div>
        </section>

        {/* Performance globale */}
        <section className="rounded-[6px_28px_6px_28px] bg-brand-yellow/25 p-6 sm:p-7">
          <h2 className="font-brand text-2xl font-bold tracking-tight text-slate-900">
            Performance globale
          </h2>
          <div className="mt-6 flex items-baseline gap-3">
            <b className="font-brand text-6xl font-bold leading-none tracking-tight text-slate-900 sm:text-7xl">
              {completionRate}&nbsp;%
            </b>
            <span className="text-sm text-muted-foreground">des missions complétées</span>
          </div>
          <div
            className="mt-4 h-3.5 overflow-hidden rounded-full bg-white"
            role="progressbar"
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Missions complétées"
          >
            <div
              className="h-full rounded-full bg-brand-teal transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <ul className="mt-7">
            <li className="flex items-center justify-between gap-4 border-t border-brand-yellow/40 py-3.5">
              <span className="text-sm">Satisfaction</span>
              <b className="font-brand text-xl text-slate-900">
                {stats.averageRating.toFixed(1)}<small className="text-sm font-normal text-muted-foreground"> /5</small>
              </b>
            </li>
            <li className="flex items-center justify-between gap-4 border-t border-brand-yellow/40 py-3.5">
              <span className="text-sm">Missions complétées</span>
              <b className="font-brand text-xl text-slate-900">
                {stats.completedMissions}<small className="text-sm font-normal text-muted-foreground"> sur {stats.totalMissions}</small>
              </b>
            </li>
            <li className="flex items-center justify-between gap-4 border-t border-brand-yellow/40 py-3.5">
              <span className="text-sm">Enfants transportés</span>
              <b className="font-brand text-xl text-slate-900">{stats.totalChildrenTransported}</b>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
