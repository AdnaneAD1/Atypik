'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, User, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock data for week days
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const currentMonth = 'Juin';

// Mock events data
const events = [
  { 
    day: 0, // Monday
    time: '07:30',
    type: 'pickup',
    child: 'Lucas',
    driver: 'Thomas',
    location: 'Domicile → École'
  },
  { 
    day: 0, // Monday
    time: '16:30',
    type: 'dropoff',
    child: 'Lucas',
    driver: 'Marie',
    location: 'École → Domicile'
  },
  { 
    day: 1, // Tuesday
    time: '07:30',
    type: 'pickup',
    child: 'Lucas',
    driver: 'Thomas',
    location: 'Domicile → École'
  },
  { 
    day: 1, // Tuesday
    time: '16:30',
    type: 'dropoff',
    child: 'Lucas',
    driver: 'Thomas',
    location: 'École → Domicile'
  },
  { 
    day: 2, // Wednesday
    time: '11:30',
    type: 'pickup',
    child: 'Léa',
    driver: 'Marie',
    location: 'École → Centre de loisirs'
  },
  { 
    day: 3, // Thursday
    time: '07:30',
    type: 'pickup',
    child: 'Lucas',
    driver: 'Thomas',
    location: 'Domicile → École'
  },
  { 
    day: 3, // Thursday
    time: '16:45',
    type: 'dropoff',
    child: 'Lucas',
    driver: 'Marie',
    location: 'École → Domicile'
  },
  { 
    day: 4, // Friday
    time: '08:00',
    type: 'pickup',
    child: 'Lucas',
    driver: 'Thomas',
    location: 'Domicile → École'
  },
  { 
    day: 4, // Friday
    time: '17:00',
    type: 'dropoff',
    child: 'Lucas',
    driver: 'Thomas',
    location: 'École → Domicile'
  },
];

export function ParentCalendarView() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);

  const prevWeek = () => setCurrentWeek(currentWeek - 1);
  const nextWeek = () => setCurrentWeek(currentWeek + 1);

  // Get today's events based on selected day
  const dayEvents = events.filter(event => event.day === selectedDay);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{currentMonth} 2025</h3>
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
            <span className="text-sm font-medium">{10 + index}</span>
            {events.some(event => event.day === index) && (
              <span className="h-1 w-1 rounded-full bg-current mt-1"></span>
            )}
          </motion.button>
        ))}
      </div>

      {dayEvents.length > 0 ? (
        <div className="space-y-3">
          {dayEvents.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start p-3 bg-secondary/50 rounded-lg"
            >
              <div className={cn(
                "flex flex-col items-center justify-center mr-3 min-w-[40px]",
                event.type === 'pickup' ? "text-success" : "text-info"
              )}>
                <span className="text-xs">
                  {event.type === 'pickup' ? 'Aller' : 'Retour'}
                </span>
                <span className="font-medium">{event.time}</span>
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium">{event.location}</p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <User className="h-3 w-3 mr-1" />
                  {event.child}
                  <span className="mx-1">•</span>
                  <Car className="h-3 w-3 mr-1" />
                  {event.driver}
                </div>
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