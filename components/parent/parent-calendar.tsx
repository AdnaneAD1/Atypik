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
import { CalendarPlus, Info, Bus, MapPin, Clock, User, MessageSquare, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  
  // États pour le modal de détail des transports
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<TransportEvent | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Utiliser le hook useTransport
  const { 
    transportEvents, 
    loading, 
    error, 
    addTransport,
    updateTransport,
    addTransportComment,
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
      distance: data.distance,
      status: 'programmed',
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

  // Fonction pour ouvrir le modal de détail d'un transport
  const handleOpenTransportDetail = (transport: TransportEvent) => {
    setSelectedTransport(transport);
    setComment('');
    setIsDetailDialogOpen(true);
  };

  // Fonction pour fermer le modal de détail
  const handleCloseTransportDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedTransport(null);
    setComment('');
    setIsSubmittingComment(false);
    setIsCancelling(false);
  };

  // Fonction pour déterminer si un transport peut être annulé
  const canCancelTransport = (transport: TransportEvent) => {
    if (!transport.date) return false;
    const transportDate = transport.date instanceof Date ? transport.date : (transport.date as any).toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(transportDate);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate >= today && transport.status !== 'completed' && transport.status !== 'cancelled';
  };

  // Fonction pour déterminer si un transport peut recevoir un commentaire
  const canCommentTransport = (transport: TransportEvent) => {
    if (!transport.date) return false;
    const transportDate = transport.date instanceof Date ? transport.date : (transport.date as any).toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(transportDate);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today || transport.status === 'completed';
  };

  // Fonction pour annuler un transport
  const handleCancelTransport = async () => {
    if (!selectedTransport) return;
    
    setIsCancelling(true);
    try {
      const success = await updateTransport(selectedTransport.id, {
        ...selectedTransport,
        status: 'cancelled'
      });
      
      if (success) {
        handleCloseTransportDetail();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler le transport.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Fonction pour soumettre un commentaire
  const handleSubmitComment = async () => {
    if (!selectedTransport || !comment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const success = await addTransportComment(selectedTransport.id, comment.trim());
      
      if (success) {
        handleCloseTransportDetail();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
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
                  <div 
                    key={event.id} 
                    className="p-3 rounded-lg border bg-background/50 cursor-pointer hover:bg-background/80 transition-colors"
                    onClick={() => handleOpenTransportDetail(event)}
                  >
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
      
      {/* Modal de détail des transports */}
      <Dialog open={isDetailDialogOpen} onOpenChange={handleCloseTransportDetail}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Détails du transport
            </DialogTitle>
            <DialogDescription>
              {selectedTransport && (
                <span>
                  {format(selectedTransport.date instanceof Date ? selectedTransport.date : (selectedTransport.date as any).toDate(), 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransport && (
            <div className="space-y-4">
              {/* Informations générales */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedTransport.childName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTransport.transportType === 'aller' ? 'Transport aller (matin)' : 'Transport retour (après-midi)'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Heure de prise en charge</p>
                    <p className="text-sm text-muted-foreground">{selectedTransport.time}</p>
                  </div>
                </div>
                
                {selectedTransport.from && selectedTransport.to && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Départ</p>
                        <p className="text-sm text-muted-foreground">{selectedTransport.from.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Arrivée</p>
                        <p className="text-sm text-muted-foreground">{selectedTransport.to.address}</p>
                      </div>
                    </div>
                    {selectedTransport.distance && (
                      <div className="text-sm text-muted-foreground pl-7">
                        Distance : {(selectedTransport.distance / 1000).toFixed(2)} km
                      </div>
                    )}
                  </div>
                )}
                
                {/* Statut */}
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    selectedTransport.status === 'completed' ? 'bg-green-500' :
                    selectedTransport.status === 'cancelled' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">Statut</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTransport.status === 'completed' ? 'Terminé' :
                       selectedTransport.status === 'cancelled' ? 'Annulé' : 'Programmé'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Section commentaire pour les transports passés/terminés */}
              {canCommentTransport(selectedTransport) && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <Label htmlFor="comment" className="font-medium">Laisser un commentaire</Label>
                  </div>
                  <Textarea
                    id="comment"
                    placeholder="Partagez votre expérience avec ce transport..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseTransportDetail}
              disabled={isSubmittingComment || isCancelling}
            >
              Fermer
            </Button>
            
            {selectedTransport && canCancelTransport(selectedTransport) && (
              <Button
                variant="destructive"
                onClick={handleCancelTransport}
                disabled={isSubmittingComment || isCancelling}
              >
                {isCancelling ? 'Annulation...' : 'Annuler le transport'}
              </Button>
            )}
            
            {selectedTransport && canCommentTransport(selectedTransport) && comment.trim() && (
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || isCancelling}
              >
                {isSubmittingComment ? 'Envoi...' : 'Envoyer le commentaire'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}