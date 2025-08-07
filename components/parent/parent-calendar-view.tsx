'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, User, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// Week days
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface ParentCalendarViewProps {
  weeklySchedule?: any[];
  loading?: boolean;
}

export function ParentCalendarView({ weeklySchedule = [], loading = false }: ParentCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);

  const prevWeek = () => setCurrentWeek(currentWeek - 1);
  const nextWeek = () => setCurrentWeek(currentWeek + 1);

  // Get current date and week dates
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (currentWeek * 7)); // Start from Monday
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  // Get events for selected day
  const selectedDate = weekDates[selectedDay];
  const dayEvents: any[] = [];
  
  // Parcourir weeklySchedule pour trouver les événements du jour sélectionné
  weeklySchedule.forEach((schedule: any) => {
    const scheduleDate = new Date(schedule.date);
    if (scheduleDate.toDateString() === selectedDate.toDateString()) {
      // Ajouter tous les trips de ce jour
      dayEvents.push(...schedule.trips);
    }
  });
  
  // Trier les événements par ordre croissant d'heure
  dayEvents.sort((a, b) => {
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });

  // Check if a day has events
  const hasEventsOnDay = (dayIndex: number) => {
    const dayDate = weekDates[dayIndex];
    return weeklySchedule.some((schedule: any) => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === dayDate.toDateString() && schedule.trips && schedule.trips.length > 0;
    });
  };

  const currentMonth = selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{currentMonth}</h3>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day, index) => (
          <motion.button
            key={index}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
              selectedDay === index
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            )}
            onClick={() => setSelectedDay(index)}
          >
            <span className="text-xs">{day}</span>
            <span className="text-sm font-medium">{weekDates[index].getDate()}</span>
            {hasEventsOnDay(index) && (
              <span className="h-1 w-1 rounded-full bg-current mt-1"></span>
            )}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : dayEvents.length > 0 ? (
        <div className="space-y-3">
          {dayEvents.map((event, index) => (
            <motion.div
              key={event.id || `event-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start p-3 bg-secondary/50 rounded-lg"
            >
              <div className={cn(
                "flex flex-col items-center justify-center mr-3 min-w-[40px]",
                event.type === 'aller' ? "text-green-600" : event.type === 'retour' ? "text-blue-600" : "text-purple-600"
              )}>
                <span className="text-xs font-medium">
                  {event.type === 'aller' ? 'Aller' : event.type === 'retour' ? 'Retour' : 'A/R'}
                </span>
                <span className="font-medium">{event.time}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="h-3 w-3 mr-1" />
                    <span className="font-medium">{event.childName}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                    event.status === 'completed' ? "bg-green-100 text-green-700" :
                    event.status === 'cancelled' ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {event.status === 'completed' ? 'Terminé' :
                     event.status === 'cancelled' ? 'Annulé' : 'Programmé'}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">
                  {event.from?.address || 'Adresse de départ'} → {event.to?.address || 'Adresse d\'arrivée'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Transport {event.type === 'aller' ? 'aller' : event.type === 'retour' ? 'retour' : 'aller-retour'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun transport prévu pour ce jour</p>
        </div>
      )}
    </div>
  );
}