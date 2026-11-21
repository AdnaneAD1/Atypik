'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound } from 'lucide-react';

interface FeaturedChildProfileProps {
  child?: any;
  loading?: boolean;
}

const initials = (name?: string) =>
  (name || 'E')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function FeaturedChildProfile({ child, loading = false }: FeaturedChildProfileProps) {
  return (
    <Card className="h-full overflow-hidden rounded-2xl border-0 bg-brand-teal text-white shadow-none">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <p className="text-xs font-medium text-white/60">Enfant du jour</p>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-brand-yellow" />
          </div>
        ) : child ? (
          <>
            <Avatar className="mt-5 h-16 w-16 border-2 border-brand-yellow">
              <AvatarImage src={child.avatar || undefined} alt={child.name} />
              <AvatarFallback className="bg-brand-yellow text-lg font-bold text-slate-900">
                {initials(child.name)}
              </AvatarFallback>
            </Avatar>

            <h3 className="mt-4 font-brand text-xl font-bold leading-tight">{child.name}</h3>
            <p className="mt-1.5 text-sm text-white/70">
              {child.age} ans, {child.school}
            </p>

            {child.nextTransport && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white">
                  {child.nextTransport.date} · {child.nextTransport.time}
                </span>
              </div>
            )}

            {child.stats && (
              <div className="mt-5 border-t border-white/15 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-brand text-2xl font-bold text-brand-yellow">
                      {child.stats.totalTrips || 0}
                    </p>
                    <p className="text-xs text-white/60">Trajets</p>
                  </div>
                  <div>
                    <p className="font-brand text-2xl font-bold text-brand-yellow">
                      {child.stats.completedTrips || 0}
                    </p>
                    <p className="text-xs text-white/60">Terminés</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-start justify-center gap-3 py-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <UserRound className="h-6 w-6 text-white/60" />
            </span>
            <p className="text-sm text-white/70">Aucun enfant sélectionné</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
