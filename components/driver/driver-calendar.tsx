'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, Info, Bus, MessageCircle, Navigation } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDriversTransport } from '@/hooks/use-drivers-transport';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function DriverCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const driverId = user?.id;
  const {
    transports,
    loading,
    error,
    getTransportsForDate,
    hasTransportsOnDate
  } = useDriversTransport(driverId);

  // États pour le modal de détail des missions
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);

  // Pour la pastille sur les jours avec missions
  const modifiers = {
    hasMission: (day: Date) => hasTransportsOnDate(day)
  };
  const modifiersClassNames = {
    hasMission: 'bg-primary/10 font-semibold text-primary relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full'
  };

  const missionsOfDay = date ? getTransportsForDate(date) : [];

  // Gestionnaires pour le modal de détail
  const handleOpenMissionDetail = (mission: any) => {
    setSelectedMission(mission);
    setIsDetailDialogOpen(true);
  };

  const handleCloseMissionDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedMission(null);
  };

  // Fonction pour envoyer un message au parent
  const handleSendMessage = (mission: any) => {
    // Redirection vers la messagerie driver
    router.push('/driver/messages');
    toast({
      title: 'Messagerie',
      description: `Redirection vers la messagerie`,
    });
  };

  // Fonction pour démarrer la navigation
  const handleStartNavigation = (mission: any) => {
    const fromAddress = typeof mission.from === 'object' && mission.from && 'address' in mission.from 
      ? mission.from.address 
      : typeof mission.from === 'string' ? mission.from : '';
    const toAddress = typeof mission.to === 'object' && mission.to && 'address' in mission.to 
      ? mission.to.address 
      : typeof mission.to === 'string' ? mission.to : '';
    
    // Ouvrir Google Maps ou l'app de navigation par défaut
    const navigationUrl = `https://www.google.com/maps/dir/${encodeURIComponent(fromAddress)}/${encodeURIComponent(toAddress)}`;
    window.open(navigationUrl, '_blank');
    
    toast({
      title: 'Navigation démarrée',
      description: 'Ouverture de Google Maps pour la navigation',
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold">Planning</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Gérez votre emploi du temps et vos missions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="h-fit">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Calendrier</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full mx-auto max-w-sm sm:max-w-none"
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
            />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Missions du jour</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              </div>
            ) : missionsOfDay.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {missionsOfDay.map((mission, index) => (
                  <div
                    key={mission.id}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer"
                    onClick={() => handleOpenMissionDetail(mission)}
                  >
                    <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm">
                      {mission.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        <h4 className="font-medium text-sm sm:text-base truncate">{mission.childName}</h4>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-start gap-2 text-xs sm:text-sm">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="truncate text-muted-foreground">
                            {typeof mission.from === 'object' && mission.from && 'address' in mission.from ? mission.from.address : typeof mission.from === 'string' ? mission.from : 'Adresse non définie'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-xs sm:text-sm">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <span className="truncate text-muted-foreground">
                            {typeof mission.to === 'object' && mission.to && 'address' in mission.to ? mission.to.address : typeof mission.to === 'string' ? mission.to : 'Adresse non définie'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-sm sm:text-base">Aucune mission prévue pour cette date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de détail des missions */}
      <Dialog open={isDetailDialogOpen} onOpenChange={handleCloseMissionDetail}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto m-4">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Détails de la mission
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedMission && date && (
                <span>
                  {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMission && (
            <div className="space-y-3 sm:space-y-4">
              {/* Informations générales */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{selectedMission.childName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {selectedMission.transportType === 'aller' ? 'Transport aller (matin)' : 'Transport retour (après-midi)'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base">Heure de prise en charge</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{selectedMission.time}</p>
                  </div>
                </div>
                
                {selectedMission.from && selectedMission.to && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm">Départ</p>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                          {typeof selectedMission.from === 'object' && selectedMission.from && 'address' in selectedMission.from 
                            ? selectedMission.from.address 
                            : typeof selectedMission.from === 'string' ? selectedMission.from : 'Adresse non définie'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm">Arrivée</p>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                          {typeof selectedMission.to === 'object' && selectedMission.to && 'address' in selectedMission.to 
                            ? selectedMission.to.address 
                            : typeof selectedMission.to === 'string' ? selectedMission.to : 'Adresse non définie'}
                        </p>
                      </div>
                    </div>
                    {selectedMission.distance && (
                      <div className="text-xs sm:text-sm text-muted-foreground pl-5 sm:pl-7">
                        Distance : {(selectedMission.distance / 1000).toFixed(2)} km
                      </div>
                    )}
                  </div>
                )}
                
                {/* Statut */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full flex-shrink-0 ${
                    selectedMission.status === 'completed' ? 'bg-green-500' :
                    selectedMission.status === 'cancelled' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm">Statut</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {selectedMission.status === 'completed' ? 'Terminé' :
                       selectedMission.status === 'cancelled' ? 'Annulé' : 'Programmé'}
                    </p>
                  </div>
                </div>
                
                {/* Informations supplémentaires pour le chauffeur */}
                {selectedMission.parentName && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm">Parent</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{selectedMission.parentName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseMissionDetail}
            >
              Fermer
            </Button>
            
            {selectedMission && (
              <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                <h4 className="font-medium text-xs sm:text-sm">Actions</h4>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => handleSendMessage(selectedMission)}
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Envoyer un message au parent
                  </Button>
                  <Button 
                    onClick={() => handleStartNavigation(selectedMission)}
                    variant="default" 
                    size="sm" 
                    className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Démarrer la navigation
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}