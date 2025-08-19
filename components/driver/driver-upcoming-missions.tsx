'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, AlertTriangle, CheckCircle2, Navigation, Phone, Car, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedRoute } from '@/components/ui/animated-route';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useRouter } from 'next/navigation';
import { RouteModal } from './route-modal';

interface UpcomingMission {
  id: string;
  child: {
    name: string;
    age: number;
    needs?: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
  };
  parent: {
    name: string;
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
  scheduledTime: string;
  distance: number;
  transportType: 'aller' | 'retour' | 'aller-retour';
}

interface DriverUpcomingMissionsProps {
  missions?: UpcomingMission[];
}

export function DriverUpcomingMissions({ missions }: DriverUpcomingMissionsProps) {
  const router = useRouter();
  // Utiliser les missions passées en props ou les données par défaut
  const upcomingMissions = missions || [];
  
  // États pour gérer les popups
  const [selectedMission, setSelectedMission] = useState<UpcomingMission | null>(null);
  const [showNeedsPopup, setShowNeedsPopup] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  
  // Fonctions pour gérer les actions des boutons
  const handleShowNeeds = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowNeedsPopup(true);
  };
  
  const handleShowRoute = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowRouteModal(true);
  };

  const handleViewAllMissions = () => {
    router.push('/driver/calendar');
  };
  
  const handleClosePopup = () => {
    setShowNeedsPopup(false);
    setShowRouteModal(false);
  };

  
  // Composant pour afficher les besoins de l'enfant
  const NeedsPopup = () => {
    if (!showNeedsPopup || !selectedMission) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClosePopup}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card max-w-md w-full rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-primary/10 border-b border-primary/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Besoins spécifiques</h3>
                  <p className="text-sm text-muted-foreground">{selectedMission.child.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClosePopup}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              {selectedMission.child.needs && selectedMission.child.needs.length > 0 ? (
                <div className="space-y-3">
                  {selectedMission.child.needs.map((need, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        need.severity === 'high' ? 'bg-red-500' :
                        need.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{need.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">{need.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium">Aucun besoin spécifique</p>
                  <p className="text-xs text-muted-foreground mt-1">Cet enfant n&apos;a pas de besoins particuliers</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border flex justify-end">
              <Button variant="outline" onClick={handleClosePopup}>
                Fermer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  // Composant pour afficher les détails de la mission avec carte Google Maps
  
  
  return (
    <>

  <Card className="rounded-lg  shadow-md bg-card overflow-hidden">
    <div className="p-0">
      {/* Header avec titre et nombre de missions */}
      <div className=" p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Missions à venir</h3>
              <Badge 
                variant="secondary" 
                className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[10px] font-medium px-2 py-0 h-5"
              >
                {upcomingMissions.length} prévues
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aujourd’hui
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">                  
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary text-xs h-9 px-3 rounded-md"
            onClick={handleViewAllMissions}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            <span>Voir toutes</span>
          </Button>
        </div>
      </div>
      
      <div className="p-4 sm:p-5 space-y-5">
        {upcomingMissions.map((mission) => (
          <Card 
            key={mission.id} 
            className="rounded-lg text-card-foreground border border-primary/10 shadow-sm bg-secondary/20 overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              {/* Enfant + type transport */}
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
                  <p className="text-xs text-muted-foreground">
                    Départ prévu à {mission.scheduledTime || '00:00'}
                  </p>
                </div>
              </div>

              {/* Itinéraire */}
              <div className="bg-secondary/30 rounded-xl p-4 mb-5 relative overflow-hidden">
                {mission.transportType === 'aller-retour' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded-full border-2 border-green-500 bg-green-50 flex items-center justify-center z-10">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                      <div className="w-0.5 h-14 bg-primary/20 my-1"></div>
                      <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center z-10">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="w-0.5 h-14 bg-primary/20 my-1"></div>
                      <div className="h-6 w-6 rounded-full border-2 border-orange-500 bg-orange-50 flex items-center justify-center z-10">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-5">
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <span className="text-green-600">Départ:</span> {mission.from.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.from.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <span className="text-blue-600">Destination:</span> {mission.to.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.to.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <span className="text-orange-600">Retour:</span> {mission.from.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.from.address}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center z-10">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      </div>
                      <div className="w-0.5 h-14 bg-primary/20 my-1"></div>
                      <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center z-10">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-5">
                      <div>
                        <p className="text-sm font-medium">{mission.from.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.from.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{mission.to.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.to.address}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Infos supplémentaires */}
                {mission.transportType === 'aller-retour' && (
                  <div className="mt-4 pt-3 border-t border-primary/10">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        Distance: {((mission.distance * 2) / 1000).toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Trajet complet
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons actions */}
              <div className="flex justify-end">
                <Button 
                  size="sm"
                  className="text-xs font-medium whitespace-nowrap bg-primary hover:bg-primary/90 text-white rounded-md h-9 px-3"
                  onClick={() => handleShowRoute(mission)}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  Voir itinéraire
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </Card>
 

    
    {/* Rendu des popups */}
    <NeedsPopup />
    <RouteModal 
      isOpen={showRouteModal}
      onClose={() => setShowRouteModal(false)}
      mission={selectedMission}
    />
  </>
  );
}
