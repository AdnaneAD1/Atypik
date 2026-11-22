'use client';

import { AlertTriangle } from 'lucide-react';
import { CarLoader } from '@/components/ui/loader';
import { DriverStats } from '@/hooks/use-driver-dashboard';
import { cn } from '@/lib/utils';

interface DriverStatsCardProps {
  stats: DriverStats;
  loading?: boolean;
  error?: string | null;
}

export function DriverStatsCard({ stats, loading = false, error = null }: DriverStatsCardProps) {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const weekly = stats?.weeklyMissions || [0, 0, 0, 0, 0, 0, 0];
  const maxCount = Math.max(...weekly, 1);
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <section>
      <h2 className="font-brand text-2xl font-bold tracking-tight text-slate-900">
        Statistiques de la semaine
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Missions par jour</p>

      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <CarLoader size={140} />
        </div>
      ) : error ? (
        <div className="flex h-52 flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="h-7 w-7 text-red-500" />
          <p className="text-sm text-muted-foreground">Erreur lors du chargement</p>
        </div>
      ) : (
        <>
          {/* Histogramme — barres posées sur un filet */}
          <div
            className="mt-7 grid h-52 grid-cols-7 items-end gap-2 border-b-2 border-slate-900"
            role="img"
            aria-label={`Missions par jour cette semaine : ${days.map((d, i) => `${weekly[i]} ${d}`).join(', ')}`}
          >
            {weekly.map((count, i) => {
              const isToday = i === todayIndex;
              return (
                <div key={days[i]} className="flex h-full flex-col items-center justify-end gap-1.5">
                  {count > 0 && (
                    <b className={cn('font-brand text-lg leading-none', isToday ? 'text-primary' : 'text-slate-900')}>
                      {count}
                    </b>
                  )}
                  <div
                    className={cn(
                      'w-full rounded-t transition-all duration-500',
                      isToday ? 'bg-primary' : 'bg-slate-200'
                    )}
                    style={{ height: count === 0 ? '6px' : `${(count / maxCount) * 100}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground sm:text-sm" aria-hidden="true">
            {days.map((d, i) => (
              <span key={d} className={i === todayIndex ? 'font-bold text-primary' : undefined}>
                {d}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
