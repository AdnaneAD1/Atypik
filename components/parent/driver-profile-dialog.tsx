'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Mail, Phone, ShieldCheck, Star, UserRound } from 'lucide-react';
import type { Driver } from '@/hooks/use-driver-selection';

interface DriverProfileDialogProps {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverProfileDialog({ driver, open, onOpenChange }: DriverProfileDialogProps) {
  if (!driver) return null;

  const s = driver.stats;
  const hasExperience = (s?.totalMissions ?? 0) > 0;
  const hasReviews = (s?.totalReviews ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md sm:rounded-[6px_28px_6px_28px]">
        {/* Identité */}
        <DialogHeader className="items-center gap-0 px-6 pb-5 pt-7 text-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={driver.avatar} alt={driver.name} />
            <AvatarFallback className="bg-slate-100">
              <UserRound className="h-10 w-10 text-slate-400" />
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="mt-4 font-brand text-2xl font-bold leading-tight">
            {driver.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Profil de votre chauffeur assigné
          </DialogDescription>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            {driver.status === 'verified' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Chauffeur vérifié
              </span>
            )}
            {hasReviews && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">
                  {s!.averageRating.toFixed(1).replace('.', ',')}
                </span>
                ({s!.totalReviews} avis)
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Chiffres — masqués pour un nouveau chauffeur */}
        {hasExperience ? (
          <>
            <dl className="mx-6 grid grid-cols-4 divide-x border-y">
              {[
                { value: s!.totalMissions, label: s!.totalMissions > 1 ? 'Missions' : 'Mission' },
                { value: s!.uniqueChildrenTransported, label: s!.uniqueChildrenTransported > 1 ? 'Enfants' : 'Enfant' },
                { value: Math.round(s!.totalKmTraveled).toLocaleString('fr-FR'), label: 'km' },
                { value: s!.thisMonthMissions, label: 'Ce mois' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse items-center gap-1 py-3.5 text-center">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="font-brand text-2xl font-bold leading-none">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-3.5 px-6 pt-5">
              {s!.punctualityRate > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ponctualité</span>
                    <span className="font-brand font-bold">{Math.round(s!.punctualityRate)} %</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-teal"
                      style={{ width: `${Math.min(100, s!.punctualityRate)}%` }}
                    />
                  </div>
                </div>
              )}
              {s!.reliabilityScore > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Fiabilité</span>
                    <span className="font-brand font-bold">{Math.round(s!.reliabilityScore)}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-teal"
                      style={{ width: `${Math.min(100, s!.reliabilityScore)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="mx-6 flex items-center justify-center gap-2 border-y py-3.5 text-center text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            Chauffeur contrôlé et validé par nos équipes — identité, permis et véhicule vérifiés.
          </p>
        )}

        {/* Contact + réassurance */}
        <div className="mt-5 space-y-2 px-6">
          {hasExperience && (
            <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              Identité, permis et véhicule vérifiés par Atypik
            </p>
          )}
          {driver.phone && (
            <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              {driver.phone}
            </p>
          )}
          {driver.email && (
            <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              {driver.email}
            </p>
          )}
        </div>

        {/* Pied */}
        <div className="mt-6 border-t px-6 py-4">
          <p className="mb-3 text-center text-xs text-muted-foreground">
            Une question sur votre chauffeur ? Notre équipe s&apos;en occupe.
          </p>
          <Button
            variant="outline"
            className="h-11 w-full border-slate-900 text-slate-900 hover:bg-slate-100"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
