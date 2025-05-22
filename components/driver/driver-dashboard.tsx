'use client';

import { useState } from 'react';
import { 
  Star, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  ChevronRight,
  Smile,
  Activity,
  HeartPulse,
  X,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { DriverMissionCard } from './driver-mission-card';
import { DriverUpcomingMissions } from './driver-upcoming-missions';
import { DriverStatsCard } from './driver-stats-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // Animation variants simplifiées
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1
    }
  };

  // Stats data
  const stats = [
    { 
      label: 'Missions aujourd\'hui', 
      value: '3', 
      icon: <Clock className="h-5 w-5 text-primary" />,
      progress: 75,
      trend: 'up'
    },
    { 
      label: 'Km parcourus', 
      value: '27.5', 
      icon: <MapPin className="h-5 w-5 text-primary" />,
      progress: 60,
      trend: 'up'
    },
    { 
      label: 'Note moyenne', 
      value: '4.9/5', 
      icon: <Star className="h-5 w-5 text-primary" />,
      progress: 98,
      trend: 'stable'
    },
    { 
      label: 'Enfants transportés', 
      value: '5', 
      icon: <User className="h-5 w-5 text-primary" />,
      progress: 100,
      trend: 'up'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl font-bold">Bonjour, {user?.name || 'Chauffeur'} </h1>
          <p className="text-muted-foreground">Voici un aperçu de votre journée de transport</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <Card className="h-full border-0 bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-700/80 shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </div>
                  
                  <div className="mt-2 mb-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                      <AnimatedCounter 
                        value={stat.value} 
                        duration={1.5} 
                        delay={0.2 + index * 0.1}
                        suffix={stat.label === 'Km parcourus' ? ' km' : ''}
                        decimalPlaces={stat.label === 'Km parcourus' ? 1 : 0}
                      />
                      {stat.trend === 'up' && (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 ml-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                          +5%
                        </span>
                      )}
                      {stat.trend === 'down' && (
                        <span className="text-sm font-medium text-red-600 dark:text-red-400 ml-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 5v14"/><path d="m5 12 7 7 7-7"/></svg>
                          -3%
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="mt-auto text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1.5 text-primary" />
                    Mis à jour il y a 5 min
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Current Mission */}
      <div>
        <DriverMissionCard />
      </div>

      {/* Upcoming Missions & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <DriverUpcomingMissions />
        </div>

        <div className="order-1 lg:order-2 mb-2 lg:mb-0">
          <DriverStatsCard />
        </div>
      </div>

      {/* Child Profile Section */}
      <div>
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-700/80 rounded-xl border-t-4 border-t-primary">
          <CardHeader className="pb-0 relative z-10">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-3 w-full sm:w-auto">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg sm:text-xl flex-shrink-0">
                  LD
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white truncate">Lucas Dubois</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">École Montessori Étoile</span>
                  </p>
                </div>
              </CardTitle>
              <div className="flex items-center gap-1 text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-medium ml-auto sm:ml-0">
                <Star className="h-4 w-4 fill-primary" />
                4.9
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* About Section */}
              <div>
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Smile className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-primary">À propos</h4>
                </div>
                <p className="text-sm">
                  Lucas est sociable mais a du mal à rester concentré pendant les longs trajets. Passionné de jeux vidéo.
                </p>
              </div>
              
              {/* Special Needs */}
              <div>
                <div className="flex items-center gap-2 text-primary mb-3">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-primary">Besoins spécifiques</h4>
                </div>
                <div className="grid gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg text-red-600 flex-shrink-0">
                      <HeartPulse className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">Allergie sévère au gluten</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">EpiPen dans son sac</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg text-red-600 flex-shrink-0">
                      <Activity className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">TDAH diagnostiqué</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Activités pour concentration</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <Button 
                variant="ghost" 
                className="w-full mt-2 text-primary hover:bg-primary/5 hover:text-primary/90"
                onClick={() => router.push('/driver/children/lucas-dubois')}
              >
                Voir fiche complète <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

}