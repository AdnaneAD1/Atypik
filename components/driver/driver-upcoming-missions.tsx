'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, User, AlertTriangle, CheckCircle2, Navigation, Phone, Car, X } from 'lucide-react';
import { AnimatedRoute } from '@/components/ui/animated-route';
import { AnimatedCounter } from '@/components/ui/animated-counter';

// Mock upcoming missions data
const upcomingMissions = [
  {
    id: '1',
    time: '10:30',
    child: {
      name: 'Emma Martin',
      age: 7,
      avatar: null,
      needs: ['Anxiété']
    },
    from: {
      name: 'École Montessori Étoile',
      address: '45 avenue Victor Hugo, Paris'
    },
    to: {
      name: 'Centre de loisirs',
      address: '12 rue des Sports, Paris'
    }
  },
  {
    id: '2',
    time: '15:45',
    child: {
      name: 'Lucas Dubois',
      age: 8,
      avatar: null,
      needs: ['TDAH', 'Allergie gluten']
    },
    from: {
      name: 'École Montessori Étoile',
      address: '45 avenue Victor Hugo, Paris'
    },
    to: {
      name: 'Domicile',
      address: '123 rue des Lilas, Paris'
    }
  },
  {
    id: '3',
    time: '17:00',
    child: {
      name: 'Léa Dubois',
      age: 6,
      avatar: null,
      needs: ['Anxiété']
    },
    from: {
      name: 'Centre de loisirs',
      address: '12 rue des Sports, Paris'
    },
    to: {
      name: 'Domicile',
      address: '123 rue des Lilas, Paris'
    }
  }
];

export function DriverUpcomingMissions() {
  // États pour gérer les popups
  const [selectedMission, setSelectedMission] = useState<typeof upcomingMissions[0] | null>(null);
  const [showNeedsPopup, setShowNeedsPopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  
  // Fonctions pour gérer les actions des boutons
  const handleShowNeeds = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowNeedsPopup(true);
  };
  
  const handleShowDetails = (mission: typeof upcomingMissions[0]) => {
    setSelectedMission(mission);
    setShowDetailsPopup(true);
  };
  
  const handleClosePopup = () => {
    setShowNeedsPopup(false);
    setShowDetailsPopup(false);
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
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClosePopup}
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
              <Button variant="ghost" size="icon" onClick={handleClosePopup}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {selectedMission.child.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-base">{selectedMission.child.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMission.child.age} ans</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedMission.child.needs.map((need, index) => (
                  <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-amber-700 dark:text-amber-400">{need}</h5>
                        <p className="text-sm text-amber-600/80 dark:text-amber-300/80 mt-1">
                          {need === 'TDAH' ? 
                            "Peut avoir besoin d'attention supplémentaire et de patience. Préfère un environnement calme." : 
                            need === 'Allergie gluten' ?
                            "Ne doit pas consommer d'aliments contenant du gluten. Apporte généralement son propre repas." :
                            "Peut manifester de l'anxiété lors des transitions. Prévoir un temps d'adaptation et rassurer l'enfant."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-5 flex justify-end">
                <Button variant="outline" onClick={handleClosePopup}>
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  // Composant pour afficher les détails de la mission
  const DetailsPopup = () => {
    if (!showDetailsPopup || !selectedMission) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClosePopup}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card max-w-3xl w-full rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Détails de la mission</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClosePopup}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <Avatar className="h-12 w-12 border-2 border-primary shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {selectedMission.child.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-base">{selectedMission.child.name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[10px] font-medium">
                      {selectedMission.id === '1' ? 'École → Loisirs' : 'Retour domicile'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Départ prévu à {selectedMission.time}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-xl p-4 mb-5">
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
                      <p className="text-sm font-medium">{selectedMission.from.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedMission.from.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedMission.to.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedMission.to.address}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold">Instructions particulières</h5>
                  <p className="text-sm text-muted-foreground">
                    {selectedMission.id === '1' ? 
                      "S'assurer que l'enfant a bien son sac de sport et sa collation pour les activités de l'après-midi." : 
                      "Vérifier que l'enfant a bien récupéré toutes ses affaires avant de quitter l'établissement."}
                  </p>
                </div>
                
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Button 
                    variant="outline"
                    className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary text-xs h-9 px-3 rounded-md"
                    onClick={handleClosePopup}
                  >
                    Fermer
                  </Button>
                  <Button 
                    className="text-primary-foreground rounded-md px-3 text-xs h-9 bg-primary hover:bg-primary/90"
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1.5" />
                    Itinéraire
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  return (
    <Card className="rounded-lg bg-card text-card-foreground overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-secondary/10">
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <span>Missions à venir</span>
        </h3>
        <p className="text-sm text-muted-foreground">Aujourd'hui · {upcomingMissions.length} missions planifiées</p>
      </div>
      
      <CardContent className="p-6 pt-0 pb-6">
        <div className="space-y-4">
          {upcomingMissions.map((mission, index) => (
            <Card 
              key={mission.id}
              className="rounded-lg text-card-foreground border-0 shadow-md bg-card overflow-hidden"
            >
              <div className="p-0">
                {/* Header avec informations de l'enfant */}
                <div className="bg-primary/5 border-b border-primary/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary shadow-md flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {mission.child.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{mission.child.name.split(' ')[0]}</h3>
                        <div className="inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[10px] font-medium px-2 py-0 h-5">
                          {index === 0 ? 'École → Loisirs' : 'Retour domicile'}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Départ prévu à {mission.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800/30 shadow-sm w-full sm:w-auto"
                      onClick={() => handleShowNeeds(mission)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500 dark:text-amber-400" />
                      Voir besoins
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Itinéraire */}
                  <div className="bg-secondary/30 rounded-xl p-4 mb-4 relative overflow-hidden">
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
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="text-xs font-medium whitespace-nowrap bg-primary hover:bg-primary/90 text-white"
                      onClick={() => handleShowDetails(mission)}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      Voir détails
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            className="text-xs font-medium whitespace-nowrap text-primary border-primary/20 hover:bg-primary/5"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Voir toutes les missions
          </Button>
        </div>
      </CardContent>
    </Card>
  );


}
