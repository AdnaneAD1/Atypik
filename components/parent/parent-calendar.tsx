'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { TransportEventDialog } from './transport-event-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTransport, TransportEvent } from '@/hooks/use-transport';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarPlus, Info, Bus } from 'lucide-react';

export function ParentCalendar() {
  // Fonction utilitaire pour vérifier si une date est passée sans modifier l'objet Date original
  const isDatePast = useCallback((dateToCheck: Date | undefined): boolean => {
    if (!dateToCheck) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCompare = new Date(dateToCheck);
    dateToCompare.setHours(0, 0, 0, 0);
    return dateToCompare < today;
  }, []);
  
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedTransportDate, setSelectedTransportDate] = useState<Date | undefined>(new Date());
  
  // Utiliser le hook useTransport
  const { 
    transportEvents, 
    loading, 
    error, 
    addTransport, 
    getTransportsForDate, 
    hasTransportsOnDate 
  } = useTransport();
  
  // Fonction pour ajouter un nouvel événement de transport
  const handleAddEvent = async (data: any) => {
    const result = await addTransport({
      childId: data.childId,
      childName: data.childName,
      date: data.date,
      time: data.time,
      transportType: data.transportType,
      from: data.from,
      to: data.to,
    });

    if (result) {
      return {
        success: true,
        message: `Transport ${data.transportType} ajouté pour ${data.childName} le ${format(data.date, 'dd/MM/yyyy')} à ${data.time}`,
      };
    } else {
      return {
        success: false,
        message: `Le transport n'a pas pu être ajouté (aucun chauffeur disponible ou erreur).`,
      };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Planning</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Consultez et gérez le planning de transport
          </p>
        </div>
        
        <Button 
          className="bg-primary hover:bg-primary/90 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto max-w-[250px]"
          onClick={() => {
            setSelectedTransportDate(date);
            setIsEventDialogOpen(true);
          }}
          disabled={isDatePast(date)}
        >
          <CalendarPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Programmer un transport
        </Button>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="bg-white dark:bg-background lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Calendrier des transports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[320px] px-4 sm:px-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border mx-auto"
                  modifiers={{
                    hasEvent: (date) => hasTransportsOnDate(date),
                    past: (date) => isDatePast(date)
                  }}
                  modifiersClassNames={{
                    hasEvent: 'bg-primary/10 font-semibold text-primary relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
                    past: 'text-muted-foreground opacity-50'
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-background">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">
                {date ? format(date, 'd MMMM yyyy', { locale: fr }) : 'Détails'}
              </CardTitle>
              {date && (
                <div className="flex text-xs text-muted-foreground">
                  {format(date, 'EEEE', { locale: fr })}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : date && getTransportsForDate(date).length > 0 ? (
              <div className="space-y-3">
                {getTransportsForDate(date).map((event) => (
                  <div key={event.id} className="p-3 rounded-lg border bg-background/50">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Bus className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{event.childName}</p>
                          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                            {event.transportType === 'aller' ? 'Aller' : 
                             event.transportType === 'retour' ? 'Retour' : 'Aller-retour'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Heure de prise en charge : {event.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Info className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Aucun transport prévu</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Cliquez sur &quot;Programmer un transport&quot; pour ajouter un trajet à cette date
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setSelectedTransportDate(date);
                    setIsEventDialogOpen(true);
                  }}
                  disabled={isDatePast(date)}
                >
                  <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                  Programmer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog pour programmer un transport */}
      <TransportEventDialog 
        open={isEventDialogOpen} 
        onOpenChange={setIsEventDialogOpen}
        selectedDate={selectedTransportDate || new Date()}
        onAddEvent={handleAddEvent}
        key={selectedTransportDate?.toISOString()} // Forcer la réinitialisation du composant quand la date change
      />
    </div>

  );
}