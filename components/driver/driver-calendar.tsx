'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDriversTransport } from '@/hooks/use-drivers-transport';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function DriverCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const driverId = user?.id;
  const {
    transports,
    loading,
    error,
    getTransportsForDate,
    hasTransportsOnDate
  } = useDriversTransport(driverId);

  // Pour la pastille sur les jours avec missions
  const modifiers = {
    hasMission: (day: Date) => hasTransportsOnDate(day)
  };
  const modifiersClassNames = {
    hasMission: 'bg-primary/10 font-semibold text-primary relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full'
  };

  const missionsOfDay = date ? getTransportsForDate(date) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Planning</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre emploi du temps et vos missions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missions du jour</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : missionsOfDay.length > 0 ? (
              <div className="space-y-4">
                {missionsOfDay.map((mission, index) => (
                  <div
                    key={mission.id}
                    className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-medium">
                      {mission.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">{mission.childName}</h4>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{mission.from}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{mission.to}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune mission prévue pour cette date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}