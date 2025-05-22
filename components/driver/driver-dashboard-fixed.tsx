'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  Truck, 
  Calendar,
  Phone,
  Navigation,
  LayoutDashboard,
  MessageSquare,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimpleRoute } from '@/components/ui/simple-route';
import { SimpleStat } from '@/components/ui/simple-stat';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { DriverPlanning } from './driver-planning';
import { DriverAllMissions } from './driver-all-missions';
import { DriverReviews } from './driver-reviews';

export function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'planning', 'missions', 'reviews'

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120
      }
    }
  };

  // Données de la mission actuelle
  const currentMission = {
    id: 'M12345',
    progress: 65,
    from: {
      name: 'Domicile de Lucas',
      address: '15 rue des Lilas, 75011 Paris'
    },
    to: {
      name: 'École Montessori Étoile',
      address: '42 avenue Victor Hugo, 75016 Paris'
    },
    departureTime: '07:45',
    arrivalTime: '08:30',
    child: {
      name: 'Lucas Dubois',
      age: 8,
      avatar: null
    }
  };

  // Barre de navigation
  const renderNavigation = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-2 z-50">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-around items-center">
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${activeView === 'dashboard' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveView('dashboard')}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs">Tableau de bord</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${activeView === 'planning' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveView('planning')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Planning</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${activeView === 'missions' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveView('missions')}
            >
              <List className="h-5 w-5" />
              <span className="text-xs">Missions</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${activeView === 'reviews' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveView('reviews')}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Avis</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Fonction pour rendre le contenu du tableau de bord
  const renderDashboardContent = () => {
    return (
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* En-tête */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Bonjour, {user?.name || 'Chauffeur'}</h1>
            <p className="text-muted-foreground">Tableau de bord du {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <Button 
            size="sm" 
            className="gap-2"
            onClick={() => setActiveView('planning')}
          >
            <Calendar className="h-4 w-4" />
            Planning
          </Button>
        </motion.div>
        
        {/* Statistiques */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SimpleStat 
              icon={Clock} 
              label="Missions aujourd'hui" 
              value={3} 
            />
            <SimpleStat 
              icon={Truck} 
              label="Km parcourus" 
              value={27.5} 
              suffix=" km"
              decimalPlaces={1}
            />
            <SimpleStat 
              icon={Star} 
              label="Note moyenne" 
              value={4.9} 
              suffix="/5"
              decimalPlaces={1}
            />
            <SimpleStat 
              icon={DollarSign} 
              label="Revenus du mois" 
              value={1250} 
              prefix="€"
            />
          </div>
        </motion.div>
        
        {/* Mission en cours */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-md border border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Mission en cours</CardTitle>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">
                  En cours
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {currentMission.child.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-semibold">{currentMission.child.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {currentMission.child.age} ans
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{currentMission.from.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{currentMission.from.address}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Départ: {currentMission.departureTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <SimpleRoute progress={currentMission.progress} />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-red-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{currentMission.to.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{currentMission.to.address}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Arrivée prévue: {currentMission.arrivalTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 gap-3">
                <Button size="sm" variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Contacter
                </Button>
                <Button size="sm" className="gap-2">
                  <Navigation className="h-4 w-4" />
                  Itinéraire
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Prochaines missions et statistiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prochaines missions */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border border-gray-100 dark:border-gray-700 h-full">
              <CardHeader className="pb-2">
                <CardTitle>Prochaines missions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mission 1 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">EM</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Emma Martin</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">6 ans</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                      15:30
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        École Primaire Voltaire
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        Domicile
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Mission 2 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">TP</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Thomas Petit</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">10 ans</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                      16:45
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        Centre de rééducation
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        Domicile
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
                      Fauteuil roulant
                    </Badge>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-primary hover:bg-primary/5"
                  onClick={() => setActiveView('missions')}
                >
                  Voir toutes les missions
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Statistiques du mois */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border border-gray-100 dark:border-gray-700 h-full">
              <CardHeader className="pb-2">
                <CardTitle>Statistiques du mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {/* Statistique 1 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Missions complétées</p>
                      <p className="text-sm font-bold">
                        <AnimatedCounter value={42} duration={1.5} />
                      </p>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 1.5 }}
                        className="h-full bg-primary rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                  
                  {/* Statistique 2 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Kilomètres parcourus</p>
                      <p className="text-sm font-bold">
                        <AnimatedCounter value={358} duration={1.5} suffix=" km" />
                      </p>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '70%' }}
                        transition={{ duration: 1.5 }}
                        className="h-full bg-green-500 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                  
                  {/* Statistique 3 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Satisfaction parents</p>
                      <p className="text-sm font-bold">
                        <AnimatedCounter value={98} duration={1.5} suffix="%" />
                      </p>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '98%' }}
                        transition={{ duration: 1.5 }}
                        className="h-full bg-amber-500 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                  
                  {/* Statistique 4 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">Ponctualité</p>
                      <p className="text-sm font-bold">
                        <AnimatedCounter value={95} duration={1.5} suffix="%" />
                      </p>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '95%' }}
                        transition={{ duration: 1.5 }}
                        className="h-full bg-blue-500 rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // Rendu conditionnel en fonction de la vue active
  const renderActiveView = () => {
    switch (activeView) {
      case 'planning':
        return <DriverPlanning />;
      case 'missions':
        return <DriverAllMissions />;
      case 'reviews':
        return <DriverReviews />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="pb-20">
      {renderActiveView()}
      {renderNavigation()}
    </div>
  );
}
