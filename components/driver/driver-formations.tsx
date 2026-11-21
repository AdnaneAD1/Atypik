'use client';

import { GraduationCap } from 'lucide-react';

export function DriverFormations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Formations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Développez vos compétences et restez à jour
        </p>
      </div>

      {/* Section éditoriale — image + texte, sans carte */}
      <div className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10">
        {/* Image */}
        <div className="relative h-56 overflow-hidden rounded-xl sm:h-[340px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/formations-side.jpg"
            alt="Chauffeur professionnel accueillant un passager"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Contenu */}
        <div className="sm:py-8">
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
            Bientôt disponible
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
            Vos formations arrivent
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Transport adapté, premiers secours, accompagnement d&apos;enfants à
            besoins spécifiques : nos modules de formation sont en cours de
            préparation pour vous aider à offrir le meilleur service possible.
          </p>
          <div className="mt-6 flex items-center gap-2.5 border-t pt-5 text-sm text-muted-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </span>
            <span>Vous serez notifié dès leur mise en ligne</span>
          </div>
        </div>
      </div>
    </div>
  );
}
