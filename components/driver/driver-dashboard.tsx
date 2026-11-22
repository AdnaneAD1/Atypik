'use client';

import { AlertTriangle } from 'lucide-react';
import { CarLoader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { DriverMissionCard } from './driver-mission-card';
import { DriverUpcomingMissions } from './driver-upcoming-missions';
import { DriverStatsCard } from './driver-stats-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useDriverDashboard } from '@/hooks/use-driver-dashboard';
import { cn } from '@/lib/utils';

export function DriverDashboard() {
  const { user } = useAuth();
  const {
    stats,
    activeMission,
    upcomingMissions,
    featuredChild,
    loading,
    error,
    refreshData
  } = useDriverDashboard();

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Affichage de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <CarLoader size={160} />
          <p className="text-muted-foreground">Chargement du dashboard...</p>
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
          <p className="text-muted-foreground">Erreur lors du chargement des données</p>
          <Button onClick={refreshData} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Préparation des données de stats pour l'affichage
  const rating = stats?.averageRating || 0;
  const ratingLabel = rating >= 4.5 ? 'Excellent' : rating >= 4 ? 'Très bien' : rating >= 3.5 ? 'Bien' : 'Correct';

  const statsData = [
    {
      label: 'Missions aujourd\'hui',
      value: stats?.todayMissions?.toString() || '0',
      tint: 'bg-primary/10',
      decimals: 0,
    },
    {
      label: 'Km à parcourir',
      value: stats?.kmTraveled?.toFixed(1) || '0.0',
      tint: 'bg-brand-teal/10',
      unit: 'km',
      decimals: 1,
    },
    {
      label: 'Note moyenne',
      value: rating.toFixed(1),
      tint: 'bg-brand-yellow/25',
      unit: '/5',
      decimals: 1,
      isRating: true,
    },
    {
      label: 'Enfants transportés',
      value: stats?.childrenTransported?.toString() || '0',
      tint: 'bg-brand-pink/10',
      decimals: 0,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bonjour, {user?.name || 'Chauffeur'}</h1>
        <p className="mt-1 text-sm text-muted-foreground capitalize">
          Voici un aperçu de votre journée de transport · {todayLabel}
        </p>
      </div>

      {/* Chiffres du jour — tuiles teintées, toujours 2 par ligne sur mobile */}
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <div key={index} className={cn('rounded-xl p-5 sm:p-6', stat.tint)}>
            <dt className="text-sm text-slate-600">{stat.label}</dt>
            <dd className="mt-1.5 flex items-baseline gap-1.5 font-brand text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              <AnimatedCounter
                value={stat.value}
                duration={1.5}
                delay={0.2 + index * 0.1}
                decimalPlaces={stat.decimals}
              />
              {stat.unit && (
                <span className="text-xl font-medium text-muted-foreground">{stat.unit}</span>
              )}
            </dd>
            {stat.isRating && (
              <div className="mt-2.5 flex items-center gap-3">
                <span className="flex gap-[3px]" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <i
                      key={i}
                      className={cn(
                        'h-2 w-[18px] rounded-sm',
                        i <= Math.round(rating) ? 'bg-brand-yellow' : 'bg-brand-yellow/25'
                      )}
                    />
                  ))}
                </span>
                <span className="text-sm font-bold text-amber-800">{ratingLabel}</span>
              </div>
            )}
          </div>
        ))}
      </dl>

      {/* Transport en cours */}
      <DriverMissionCard
        mission={activeMission || undefined}
        onCompleted={refreshData}
      />

      {/* Missions à venir + statistiques de la semaine */}
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <DriverUpcomingMissions missions={upcomingMissions || undefined} onStarted={refreshData} />
        <DriverStatsCard stats={stats} />
      </div>
    </div>
  );

}