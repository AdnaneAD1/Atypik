'use client';

import { useState } from 'react';
import { Car, Clock, MapPin, Navigation, User, CheckCircle2, AlertTriangle, Phone, X, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AnimatedRoute } from '@/components/ui/animated-route';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface DriverMissionCardProps {
  mission?: {
    id: string;
    status: 'active' | 'pending' | 'completed';
    child: {
      name: string;
      age: number;
      avatar?: string;
      needs?: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
    };
    parent: {
      name: string;
      avatar?: string;
      phone?: string;
    };
    from: {
      name: string;
      address: string;
      lat?: number;
      lng?: number;
    };
    to: {
      name: string;
      address: string;
      lat?: number;
      lng?: number;
    };
    timeEstimate: string;
    distance: number;
    scheduledTime: string;
    progress: number;
    time: string;
    transportType: 'aller' | 'retour' | 'aller-retour';
  };
}

function DriverMissionCard({ mission }: DriverMissionCardProps) {
  // États pour les popups
  const [showNeeds, setShowNeeds] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Si aucune mission active, afficher un message
  if (!mission) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-700/80 rounded-xl border-t-4 border-t-primary">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Aucune mission active</h3>
            <p className="text-sm text-muted-foreground">Vous n&apos;avez pas de mission en cours pour le moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fonctions pour gérer les actions
  const handleCallParent = () => {
  };

  const handleViewMap = () => {
    setShowMap(true);
  };

  const handleShowNeeds = () => {
    setShowNeeds(true);
  };

  const handleCloseNeeds = () => {
    setShowNeeds(false);
  };

  const handleCloseMap = () => {
    setShowMap(false);
  };

  // Composant pour la popup des besoins
  const NeedsPopup = () => {
    if (!showNeeds) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseNeeds}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card max-w-md w-full rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-lg">Besoins spécifiques</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseNeeds}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {mission.child.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-base">{mission.child.name}</h4>
                  <p className="text-sm text-muted-foreground">{mission.child.age} ans</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {mission.child.needs?.map((need, index) => (
                  <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-amber-700 dark:text-amber-400">{need.type || need.description}</h5>
                        <p className="text-sm text-amber-600/80 dark:text-amber-300/80 mt-1">
                          {need.description || (need.type === 'TDAH' ? 
                            'Peut avoir besoin d\'attention supplémentaire et de patience. Préfère un environnement calme.' : 
                            'Besoin spécial à prendre en compte.')}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>
              
              <div className="mt-5 flex justify-end">
                <Button variant="outline" onClick={handleCloseNeeds}>
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Composant pour la popup de la carte
  const MapPopup = () => {
    if (!showMap) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseMap}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card max-w-3xl w-full h-[80vh] rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Suivi du trajet en direct</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseMap}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-0 h-full relative">
              {/* Ici, dans une vraie application, on aurait une carte interactive */}
              <div className="bg-gray-100 dark:bg-gray-800 h-full w-full flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Carte de suivi en temps réel</h4>
                  <p className="text-muted-foreground">Dans une application réelle, une carte interactive serait affichée ici.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <Card className="rounded-lg bg-card text-card-foreground overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-secondary/10">
        <div className="flex flex-col space-y-1.5 p-6 pb-2">
          <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <span>Mission en cours</span>
          </h3>
          <p className="text-sm text-muted-foreground">Suivez en temps réel le transport de votre enfant</p>
        </div>
        
        <CardContent className="p-6 pt-0 pb-6">
          <Card className="rounded-lg text-card-foreground border-0 shadow-md bg-card overflow-hidden">
            <div className="p-0">
              {/* Header avec statut et boutons */}
              <div className="bg-primary/5 border-b border-primary/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">Transport en cours</h3>
                      <div className="inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[10px] font-medium px-2 py-0 h-5">
                        En route
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Départ {mission.time}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary text-xs h-9 px-3 rounded-md"
                    onClick={handleViewMap}
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Voir sur la carte</span>
                    <span className="sm:hidden">Carte</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary text-xs h-9 px-3 rounded-md"
                    onClick={handleCallParent}
                  >
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    <span>Contacter</span>
                  </Button>
                </div>
              </div>
              
              <div className="p-4 sm:p-5">
                {/* Informations sur l'enfant */}
                <div className="flex items-center gap-3 mb-5">
                  <Avatar className="relative flex shrink-0 overflow-hidden rounded-full h-12 w-12 border-2 border-primary">
                    <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {mission.child.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-semibold">{mission.child.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          mission.transportType === 'aller-retour'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : mission.transportType === 'aller'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {
                          mission.transportType === 'aller-retour'
                            ? 'Aller-Retour'
                            : mission.transportType === 'aller'
                            ? 'Aller (matin)'
                            : 'Retour (après-midi)'
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Itinéraire */}
                <div className="bg-secondary/30 rounded-xl p-4 mb-5 relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-900/20 flex items-center justify-center z-10">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                      <div className="w-0.5 h-14 bg-primary/20 my-1"></div>
                      <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center z-10">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-5">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{mission.from.name}</p>
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Départ à {mission.time}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.from.address}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{mission.to.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.to.address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-primary">{mission.progress}% du trajet</span>
                      <span>{mission.distance}</span>
                    </div>
                    <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full bg-primary rounded-full transition-all duration-500 ease-in-out absolute top-0 left-0 w-[${mission.progress}%]`}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Informations sur le parent */}
                <div className="flex items-center justify-between bg-secondary/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10 border border-primary/20">
                      <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-primary/5 text-primary">
                        {mission.parent.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{mission.parent.name}</p>
                        <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30 font-medium">
                          Parent
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span>{mission.from.address}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary text-xs h-9 px-3 rounded-md"
                      onClick={handleViewMap}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Carte</span>
                    </Button>
                    <Button 
                      className="text-primary-foreground rounded-md px-3 text-xs h-9 bg-primary hover:bg-primary/90"
                      onClick={handleCallParent}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      Contacter
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </CardContent>
      </Card>
      
      {/* Popups */}
      <NeedsPopup />
      <MapPopup />
    </>
  );
}

export { DriverMissionCard };
export default DriverMissionCard;
