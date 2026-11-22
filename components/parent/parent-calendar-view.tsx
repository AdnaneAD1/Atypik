'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CarLoader } from '@/components/ui/loader';

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface ParentCalendarViewProps {
  weeklySchedule?: any[];
  loading?: boolean;
}

export function ParentCalendarView({ weeklySchedule = [], loading = false }: ParentCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);

  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(today.getDate() + diffToMonday + (currentWeek * 7));

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const selectedDate = weekDates[selectedDay];
  const dayEvents: any[] = [];

  weeklySchedule.forEach((schedule: any) => {
    const scheduleDate = new Date(schedule.date);
    if (scheduleDate.toDateString() === selectedDate.toDateString()) {
      dayEvents.push(...schedule.trips);
    }
  });

  dayEvents.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const hasEventsOnDay = (dayIndex: number) => {
    const dayDate = weekDates[dayIndex];
    return weeklySchedule.some((schedule: any) => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === dayDate.toDateString() && schedule.trips && schedule.trips.length > 0;
    });
  };

  const isToday = (dayIndex: number) => weekDates[dayIndex].toDateString() === today.toDateString();

  const currentMonth = selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const typeLabel = (type: string) =>
    type === 'aller-retour' ? 'aller-retour' : type === 'aller' ? 'aller' : 'retour';

  return (
    <div className="space-y-5">
      {/* Mois + navigation semaine */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm capitalize text-muted-foreground">{currentMonth}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(currentWeek - 1)}
          className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          Semaine précédente
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(currentWeek + 1)}
          className="h-10 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          Semaine suivante
        </Button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((day, index) => {
          const selected = selectedDay === index;
          return (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg border py-2.5 transition-colors',
                selected
                  ? 'border-brand-yellow bg-brand-yellow text-slate-900'
                  : 'border-slate-200 text-slate-900 hover:border-brand-yellow/60'
              )}
            >
              {isToday(index) && (
                <span className="absolute -top-2.5 rounded-full bg-brand-yellow px-1.5 py-px text-[9px] font-bold uppercase text-slate-900">
                  Auj.
                </span>
              )}
              <span className={cn('text-[11px]', selected ? 'text-white/70' : 'text-muted-foreground')}>
                {day}
              </span>
              <span className="text-base font-bold">{weekDates[index].getDate()}</span>
              {hasEventsOnDay(index) && (
                <span className={cn('mt-1 h-1.5 w-1.5 rounded-full', selected ? 'bg-slate-900' : 'bg-brand-yellow')} />
              )}
            </button>
          );
        })}
      </div>

      {/* Filet marine */}
      <div className="border-t-2 border-brand-yellow" />

      {/* Transports du jour */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <CarLoader size={110} />
        </div>
      ) : dayEvents.length > 0 ? (
        <div className="divide-y">
          {dayEvents.map((event, index) => (
            <div key={event.id || `event-${index}`} className="flex items-baseline gap-4 py-3.5 first:pt-0">
              <span className="w-12 shrink-0 text-lg font-bold text-slate-900">{event.time}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{event.childName}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {event.from?.address || 'Adresse de départ'} · {typeLabel(event.type)}
                </p>
              </div>
              {(event.status === 'completed' || event.status === 'cancelled') && (
                <span className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  event.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-600'
                )}>
                  {event.status === 'completed' ? 'Terminé' : 'Annulé'}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Aucun transport prévu pour ce jour
        </p>
      )}
    </div>
  );
}
