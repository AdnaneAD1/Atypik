'use client';

import { useState } from 'react';
import { Car, Clock, MapPin, Navigation, User, CheckCircle2, Phone, MessageSquare, AlertCircle, X, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function ParentUpcomingTrip() {
  const { toast } = useToast();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isLiveTrackingActive, setIsLiveTrackingActive] = useState(false);
  
  // Simulated active trip
  const trip = {
    id: '123',
    status: 'active',
    child: {
      name: 'Lucas',
      avatar: null,
    },
    driver: {
      name: 'Thomas Bernard',
      avatar: null,
      rating: 4.9,
      car: 'Renault Espace Gris',
      plate: 'AB-123-CD',
      phone: '06 12 34 56 78',
    },
    from: {
      name: 'Domicile',
      address: '123 rue des Lilas, Paris',
    },
    to: {
      name: 'École Montessori Étoile',
      address: '45 avenue Victor Hugo, Paris',
    },
    timeEstimate: '15 min',
    distance: '5.2 km',
    progress: 68,
    departureTime: '08:15',
    arrivalTime: '08:30',
    startTime: '08:15',
    estimatedArrival: '08:30',
  };
  
  // Fonctions pour gérer les actions
  const handleContactDriver = () => {
    setIsContactDialogOpen(true);
  };
  
  const handleCall = () => {
    // Simulation d'un appel téléphonique
    toast({
      title: 'Appel en cours',
      description: `Appel vers ${trip.driver.name} (${trip.driver.phone})`,
    });
    setIsContactDialogOpen(false);
  };
  
  const handleMessage = () => {
    // Simulation d'envoi de message
    toast({
      title: 'Message envoyé',
      description: `Votre message a été envoyé à ${trip.driver.name}`,
    });
    setIsContactDialogOpen(false);
  };
  
  const handleViewMap = () => {
    setIsMapDialogOpen(true);
  };
  
  const handleLiveTracking = () => {
    setIsLiveTrackingActive(!isLiveTrackingActive);
    
    toast({
      title: isLiveTrackingActive ? 'Suivi en direct désactivé' : 'Suivi en direct activé',
      description: isLiveTrackingActive 
        ? 'Vous ne recevrez plus de mises à jour en temps réel' 
        : 'Vous recevrez des mises à jour en temps réel sur le trajet',
    });
  };

  return (
    <>
      <Card className="border-0 shadow-md bg-card overflow-hidden">
        <CardContent className="p-0">
          {/* En-tête avec statut - Amélioré pour mobile */}
          <div className="bg-primary/5 border-b border-primary/10 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Car className="h-5 w-5 text-primary" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold">Transport en cours</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[10px] font-medium px-2 py-0 h-5">
                    En route
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Départ {trip.startTime} · Arrivée estimée {trip.estimatedArrival}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-9 border-primary/10 text-primary hover:text-primary hover:bg-primary/5 flex-1 sm:flex-initial"
                onClick={handleContactDriver}
              >
                <Phone className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Contacter
              </Button>
              
              <Button 
                size="sm" 
                className="text-xs h-9 bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
                onClick={handleViewMap}
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                Voir carte
              </Button>
            </div>
          </div>
          
          {/* Contenu principal - Amélioré pour mobile */}
          <div className="p-3 sm:p-4">
            {/* Progression du trajet */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium">Progression du trajet</span>
                </div>
                <span className="text-sm font-bold">{trip.progress}%</span>
              </div>
              
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${trip.progress}%` }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-primary rounded-full"
                ></motion.div>
              </div>
              
              <div className="flex justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-muted-foreground">{trip.from.name}</span>
                </div>
                <span className="text-xs text-primary font-medium">{trip.timeEstimate} restant</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-xs text-muted-foreground">{trip.to.name}</span>
                </div>
              </div>
            </div>
            
            {/* Informations sur le trajet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-secondary/20 rounded-lg p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Départ</h4>
                <p className="text-sm font-medium mb-1 line-clamp-1">{trip.from.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{trip.from.address}</p>
              </div>
              
              <div className="bg-secondary/20 rounded-lg p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Arrivée</h4>
                <p className="text-sm font-medium mb-1 line-clamp-1">{trip.to.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{trip.to.address}</p>
              </div>
            </div>
            
            {/* Informations sur l'enfant et le chauffeur */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-3 border-t border-dashed border-primary/10">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0">
                  <AvatarImage src={trip.driver.avatar || undefined} alt={trip.driver.name} />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {trip.driver.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium truncate">{trip.driver.name}</p>
                    <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded px-1.5 py-0.5 flex-shrink-0">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span className="text-xs font-medium">{trip.driver.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {trip.driver.car} · <span className="font-medium">{trip.driver.plate}</span>
                  </p>
                </div>
              </div>
              
              <Button 
                size="sm" 
                className={`text-xs h-9 ${isLiveTrackingActive ? 'bg-primary/90 hover:bg-primary/80' : 'bg-primary hover:bg-primary/90'} w-full sm:w-auto mt-2 sm:mt-0`}
                onClick={handleLiveTracking}
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                {isLiveTrackingActive ? 'Suivi actif' : 'Suivre en direct'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog de contact avec le chauffeur */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contacter le chauffeur</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center gap-3 my-4">
            <Avatar className="h-12 w-12 border border-primary/20">
              <AvatarImage src={trip.driver.avatar || undefined} alt={trip.driver.name} />
              <AvatarFallback className="bg-primary/5 text-primary">
                {trip.driver.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <p className="font-medium">{trip.driver.name}</p>
              <p className="text-sm text-muted-foreground">{trip.driver.phone}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
              Appeler
            </Button>
            
            <Button 
              className="flex items-center justify-center gap-2"
              onClick={handleMessage}
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
          </div>
          
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Contactez le chauffeur uniquement pour des informations urgentes concernant le transport en cours.</p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de carte */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Suivi du trajet</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setIsMapDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="h-[400px] w-full bg-secondary/50 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1">Carte de suivi</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                La carte de suivi en temps réel serait affichée ici, montrant la position actuelle du véhicule et l&apos;itinéraire.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMapDialogOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
