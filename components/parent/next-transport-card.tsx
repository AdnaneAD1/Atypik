'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CalendarClock, Navigation } from 'lucide-react';
import type { ChildProfile, UpcomingTrip } from '@/hooks/use-dashboard';

interface NextTransportCardProps {
  trip: UpcomingTrip | null;
  child?: ChildProfile | null;
  loading?: boolean;
}

const initials = (name?: string) =>
  (name || 'E')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const TYPE_LABELS: Record<UpcomingTrip['transportType'], string> = {
  aller: 'Aller',
  retour: 'Retour',
  'aller-retour': 'Aller-retour',
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

const formatTime = (date: Date) =>
  date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function NextTransportCard({ trip, child, loading = false }: NextTransportCardProps) {
  const router = useRouter();

  return (
    <Card className="h-full overflow-hidden rounded-2xl border-0 bg-brand-teal text-white shadow-none">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <p className="text-xs font-medium text-white/60">Prochain transport</p>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-brand-yellow" />
          </div>
        ) : trip ? (
          <>
            <div className="mt-5 flex items-center gap-3">
              <Avatar className="h-14 w-14 shrink-0 border-2 border-brand-yellow">
                <AvatarImage src={child?.avatar || undefined} alt={trip.childName} />
                <AvatarFallback className="bg-brand-yellow text-base font-bold text-slate-900">
                  {initials(trip.childName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="truncate font-brand text-xl font-bold leading-tight">
                  {trip.childName}
                </h3>
                <p className="mt-1 truncate text-sm text-white/70">
                  {[child?.age && `${child.age} ans`, child?.school].filter(Boolean).join(', ') || 'Votre enfant'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium capitalize text-white">
                {formatDate(trip.scheduledTime)} · {formatTime(trip.scheduledTime)}
              </span>
              <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white">
                {TYPE_LABELS[trip.transportType]}
              </span>
            </div>

            <div className="mt-auto border-t border-white/15 pt-4">
              <div className="space-y-1.5">
                <p className="truncate text-sm text-white/80">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-yellow align-middle" />
                  {trip.from.address}
                </p>
                <p className="truncate text-sm text-white/80">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-white/50 align-middle" />
                  {trip.to.address}
                </p>
              </div>
              <p className="mt-3 text-xs text-white/60">
                Chauffeur : <span className="font-semibold text-white/85">{trip.driverName}</span>
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-start justify-center gap-3 py-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <CalendarClock className="h-6 w-6 text-white/60" />
            </span>
            <p className="text-sm text-white/70">Aucun transport programmé</p>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => router.push('/parent/calendar')}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Programmer un transport
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
