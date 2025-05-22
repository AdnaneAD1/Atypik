'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Clock, MapPin, Star, Calendar, User, DollarSign, 
  Truck, Award, Zap, BarChart, Activity, TrendingUp, 
  Compass, Hourglass, Phone, ChevronRight, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JourneyTracker } from '@/components/ui/journey-tracker';
import { StatsCard } from '@/components/ui/stats-card';
import { MissionCard } from '@/components/ui/mission-card';
import { ChildProfileCard } from '@/components/ui/child-profile-card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export function DriverDashboardNew() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
    progress: 68,
    startPoint: 'Domicile de Lucas',
    startAddress: '15 rue des Lilas, 75011 Paris',
    endPoint: 'École Montessori Étoile',
    endAddress: '42 avenue Victor Hugo, 75016 Paris',
    startTime: '07:45',
    endTime: '08:30',
    child: {
      name: 'Lucas Dubois',
      age: 8,
      avatar: null,
      needs: ['TDAH', 'Allergie gluten']
    }
  };

  // Données des statistiques
  const statsData = [
    { 
      title: 'Missions aujourd\'hui', 
      value: 3, 
      icon: Clock,
      trend: 'up',
      trendValue: '+1',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      title: 'Km parcourus', 
      value: 27.5, 
      icon: Truck,
      suffix: ' km',
      decimalPlaces: 1,
      trend: 'up',
      trendValue: '+4.2',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    { 
      title: 'Note moyenne', 
      value: 4.9, 
      icon: Star,
      suffix: '/5',
      decimalPlaces: 1,
      trend: 'stable',
      trendValue: '0',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    { 
      title: 'Revenus du mois', 
      value: 1250, 
      icon: DollarSign,
      prefix: '€',
      trend: 'up',
      trendValue: '+€320',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
  ];

  // Données des prochaines missions
  const upcomingMissions = [
    {
      id: 'M12346',
      time: '15:30',
      child: {
        name: 'Emma Martin',
        age: 6,
        avatar: null,
        needs: ['Anxiété de séparation']
      },
      from: {
        name: 'École Primaire Voltaire',
        address: '28 rue Voltaire, 75011 Paris'
      },
      to: {
        name: 'Domicile',
        address: '12 rue Saint-Maur, 75011 Paris'
      }
    },
    {
      id: 'M12347',
      time: '16:45',
      child: {
        name: 'Thomas Petit',
        age: 10,
        avatar: null,
        needs: ['Fauteuil roulant', 'Diabète type 1']
      },
      from: {
        name: 'Centre de rééducation',
        address: '5 avenue de la République, 75011 Paris'
      },
      to: {
        name: 'Domicile',
        address: '8 boulevard Beaumarchais, 75011 Paris'
      }
    }
  ];

  // Données du profil enfant
  const childProfile = {
    id: 'C5678',
    name: 'Lucas Dubois',
    initials: 'LD',
    school: 'École Montessori Étoile',
    rating: 4.9,
    about: 'Lucas est sociable mais a du mal à rester concentré pendant les longs trajets. Passionné de jeux vidéo et de dessins animés. Préfère s\'asseoir côté fenêtre.',
    specialNeeds: [
      {
        id: 'SN001',
        title: 'Allergie sévère au gluten',
        description: 'EpiPen dans son sac à dos bleu',
        severity: 'high' as const,
        icon: 'heartPulse' as const
      },
      {
        id: 'SN002',
        title: 'TDAH diagnostiqué',
        description: 'Peut avoir besoin d\'activités pour maintenir sa concentration',
        severity: 'medium' as const,
        icon: 'activity' as const
      }
    ]
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header avec salutation et date */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour, {user?.name || 'Chauffeur'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button 
          size="sm" 
          className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-0"
        >
          <Calendar className="h-4 w-4" />
          Planning
        </Button>
      </motion.div>

      {/* Statistiques */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend as any}
              trendValue={stat.trendValue}
              bgColor={stat.bgColor}
              iconColor={stat.iconColor}
              prefix={stat.prefix}
              suffix={stat.suffix}
              decimalPlaces={stat.decimalPlaces}
            />
          ))}
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Mission actuelle et tracker */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mission en cours</h2>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
                En cours
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {currentMission.child.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-base font-semibold">{currentMission.child.name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {currentMission.child.needs.map((need, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="text-[10px] h-5 py-0 px-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 font-medium"
                    >
                      {need}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <JourneyTracker
              startPoint={currentMission.startPoint}
              startAddress={currentMission.startAddress}
              endPoint={currentMission.endPoint}
              endAddress={currentMission.endAddress}
              progress={currentMission.progress}
              startTime={currentMission.startTime}
              endTime={currentMission.endTime}
            />
            
            <div className="flex justify-end mt-5 gap-3">
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs font-medium bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Contacter
              </Button>
              <Button 
                size="sm" 
                className="text-xs font-medium"
              >
                <Compass className="h-3.5 w-3.5 mr-1.5" />
                Itinéraire
              </Button>
            </div>
          </div>
          
          {/* Prochaines missions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prochaines missions</h2>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-xs font-medium text-primary hover:bg-primary/5"
              >
                Voir tout
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {upcomingMissions.map((mission) => (
                <MissionCard 
                  key={mission.id} 
                  mission={mission} 
                  onViewDetails={(id) => router.push(`/driver/missions/${id}`)}
                />
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Colonne de droite - Profil enfant */}
        <motion.div variants={itemVariants}>
          <ChildProfileCard 
            child={childProfile} 
            onViewProfile={(id) => router.push(`/driver/children/${id}`)}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
