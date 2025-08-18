'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback } from "react";
import { TransportEventDialog } from './transport-event-dialog';
import { SubscriptionModal } from './subscription-modal';
import { DriverSelectionModal } from './driver-selection-modal';
import { useToast } from '@/hooks/use-toast';
import { useTransport, TransportEvent } from '@/hooks/use-transport';
import { useSubscription } from '@/hooks/use-subscription';
import { useDriverSelection, Driver } from '@/hooks/use-driver-selection';
import { useAuth } from '@/lib/auth/auth-context';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarPlus, Info, Bus, MapPin, Clock, User, MessageSquare, X, Loader2, Star } from 'lucide-react';
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
  const [rating, setRating] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // États pour le modal d'abonnement
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // États pour le modal de sélection de chauffeur
  const [isDriverSelectionOpen, setIsDriverSelectionOpen] = useState(false);
  
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
  
  // Utiliser le hook useSubscription
  const { 
    subscription, 
    loading: subscriptionLoading, 
    hasActiveSubscription, 
    canCreateTransport,
    weeklyTransportCount,
    loadSubscription 
  } = useSubscription();
  
  // Utiliser les hooks d'authentification et de sélection de chauffeur
  const { user } = useAuth();
  const { selectedDriver, hasSelectedDriver, canCreateTransport: canCreateWithDriver } = useDriverSelection();
  
  // Fonction pour ajouter un nouvel événement de transport
  const handleAddEvent = async (data: any) => {
    // Vérifier l'abonnement avant de créer le transport
    if (!canCreateTransport) {
      // Déterminer le message d'erreur selon la situation
      let message = 'Vous devez souscrire à un abonnement pour programmer un transport.';
      
      if (hasActiveSubscription && subscription?.type === 'standard' && weeklyTransportCount >= 2) {
        message = `Limite atteinte : votre abonnement Standard permet jusqu'à 2 transports par semaine. Vous avez déjà programmé ${weeklyTransportCount} transport(s) cette semaine. Passez à l'abonnement Premium pour des transports illimités.`;
      } else if (!hasActiveSubscription) {
        message = 'Vous devez souscrire à un abonnement pour programmer un transport.';
      }
      
      setIsSubscriptionModalOpen(true);
      return {
        success: false,
        message,
      };
    }

    // Vérifier qu'un chauffeur est sélectionné
    if (!hasSelectedDriver || !selectedDriver) {
      toast({
        title: "Chauffeur requis",
        description: "Vous devez sélectionner un chauffeur avant de programmer un transport.",
        variant: "destructive",
      });
      return {
        success: false,
        message: 'Veuillez sélectionner un chauffeur avant de programmer un transport.',
      };
    }

    const result = await addTransport({
      childId: data.childId,
      childName: data.childName,
      date: data.date,
      time: data.time,
      transportType: data.transportType,
      from: data.from,
      to: data.to,
      distance: data.distance,
      driverId: selectedDriver.id,
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
    setRating(0);
    setIsDetailDialogOpen(true);
  };

  // Fonction pour fermer le modal de détail
  const handleCloseTransportDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedTransport(null);
    setComment('');
    setRating(0);
    setIsSubmittingComment(false);
    setIsCancelling(false);
  };

  // Gestionnaires pour le modal d'abonnement
  const handleCloseSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
  };

  const handleSubscriptionCreated = async () => {
    // Recharger les données d'abonnement
    await loadSubscription();
    toast({
      title: 'Abonnement activé !',
      description: 'Vous pouvez maintenant programmer vos transports.',
    });
  };

  // Fonction pour gérer l'ouverture du modal de sélection de chauffeur
  const handleOpenDriverSelection = () => {
    setIsDriverSelectionOpen(true);
  };

  // Fonction pour gérer la sélection d'un chauffeur
  const handleDriverSelected = (driver: Driver) => {
    toast({
      title: "Chauffeur sélectionné",
      description: `${driver.name} a été sélectionné comme votre chauffeur.`,
    });
    // Le modal se ferme automatiquement après la sélection
  };

  // Fonction pour ouvrir le dialog de transport (avec vérification du chauffeur)
  const handleOpenTransportDialog = () => {
    if (!hasSelectedDriver || !selectedDriver) {
      // Ouvrir le modal de sélection de chauffeur si aucun n'est sélectionné
      handleOpenDriverSelection();
      return;
    }
    
    // Si un chauffeur est sélectionné, ouvrir directement le dialog de transport
    setIsEventDialogOpen(true);
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

  // Fonction pour soumettre une évaluation avec commentaire
  const handleSubmitComment = async () => {
    if (!selectedTransport || !comment.trim() || rating === 0) return;
    
    setIsSubmittingComment(true);
    try {
      const success = await addTransportComment(selectedTransport.id, rating, comment.trim());
      
      if (success) {
        handleCloseTransportDetail();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'évaluation.',
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
            handleOpenTransportDialog();
          }}
          disabled={isDatePast(date)}
        >
          <CalendarPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Programmer un transport
        </Button>
      </div>
      
      {/* Section chauffeur sélectionné */}
      {user?.role === 'parent' && (
        <Card className="bg-white dark:bg-background mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Chauffeur sélectionné
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDriver ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {selectedDriver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedDriver.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {selectedDriver.rating && selectedDriver.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>{selectedDriver.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {selectedDriver.totalTrips && selectedDriver.totalTrips > 0 && (
                        <span>• {selectedDriver.totalTrips} trajets</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenDriverSelection}
                >
                  Changer
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Aucun chauffeur sélectionné</p>
                    <p className="text-sm text-muted-foreground">Choisissez un chauffeur pour programmer des transports</p>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleOpenDriverSelection}
                >
                  Sélectionner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="bg-white dark:bg-background lg:col-span-2 h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Calendrier des transports</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full h-full"
              modifiers={{
                hasEvent: (date) => hasTransportsOnDate(date),
                past: (date) => isDatePast(date)
              }}
              modifiersClassNames={{
                hasEvent: 'bg-primary/10 font-semibold text-primary relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
                past: 'text-muted-foreground opacity-50'
              }}
            />
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
                    handleOpenTransportDialog();
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
              
              {/* Section évaluation pour les transports passés/terminés */}
              {canCommentTransport(selectedTransport) && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Évaluer ce transport</Label>
                  </div>
                  
                  {/* Système de notation avec étoiles */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Note (obligatoire)</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`h-6 w-6 transition-colors ${
                              star <= rating 
                                ? "text-amber-400 fill-amber-400" 
                                : "text-muted-foreground hover:text-amber-300"
                            }`} 
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {rating} étoile{rating > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Commentaire */}
                  <div className="space-y-2">
                    <Label htmlFor="comment" className="text-sm text-muted-foreground">Commentaire</Label>
                    <Textarea
                      id="comment"
                      placeholder="Partagez votre expérience avec ce transport..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                  </div>
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
            
            {selectedTransport && canCommentTransport(selectedTransport) && comment.trim() && rating > 0 && (
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || isCancelling}
              >
                {isSubmittingComment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer l\'évaluation'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal d'abonnement */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={handleCloseSubscriptionModal}
        onSubscriptionCreated={handleSubscriptionCreated}
      />
      
      {/* Modal de sélection de chauffeur */}
      <DriverSelectionModal
        isOpen={isDriverSelectionOpen}
        onClose={() => setIsDriverSelectionOpen(false)}
        onDriverSelected={handleDriverSelected}
      />
    </div>

  );
}