'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';

export function DriverPlanning() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
  
  // Fonction pour formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  
  // Fonction pour naviguer entre les jours
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };
  
  // Données des missions pour la journée sélectionnée
  const missions = [
    {
      id: 'M12345',
      time: '07:45 - 08:30',
      child: {
        name: 'Lucas Dubois',
        age: 8,
        avatar: null
      },
      from: {
        name: 'Domicile de Lucas',
        address: '15 rue des Lilas, 75011 Paris'
      },
      to: {
        name: 'École Montessori Étoile',
        address: '42 avenue Victor Hugo, 75016 Paris'
      },
      status: 'completed'
    },
    {
      id: 'M12346',
      time: '15:30 - 16:15',
      child: {
        name: 'Emma Martin',
        age: 6,
        avatar: null
      },
      from: {
        name: 'École Primaire Voltaire',
        address: '28 rue Voltaire, 75011 Paris'
      },
      to: {
        name: 'Domicile',
        address: '12 rue Saint-Maur, 75011 Paris'
      },
      status: 'upcoming'
    },
    {
      id: 'M12347',
      time: '16:45 - 17:30',
      child: {
        name: 'Thomas Petit',
        age: 10,
        avatar: null
      },
      from: {
        name: 'Centre de rééducation',
        address: '5 avenue de la République, 75011 Paris'
      },
      to: {
        name: 'Domicile',
        address: '8 boulevard Beaumarchais, 75011 Paris'
      },
      status: 'upcoming'
    }
  ];
  
  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };
  
  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'upcoming':
        return 'À venir';
      case 'in-progress':
        return 'En cours';
      default:
        return 'Non défini';
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* En-tête du planning */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Planning</h1>
          <p className="text-muted-foreground">Vos missions planifiées</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 bg-primary/10 rounded-md text-primary font-medium">
            {formatDate(currentDate)}
          </div>
          <Button size="sm" variant="outline" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
      
      {/* Liste des missions */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md border border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Missions du {formatDate(currentDate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {missions.length > 0 ? (
              missions.map((mission) => (
                <div 
                  key={mission.id} 
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {mission.child.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{mission.child.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {mission.child.age} ans
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`border-0 ${getStatusColor(mission.status)}`}>
                        {getStatusLabel(mission.status)}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary border-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {mission.time}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <MapPin className="h-3 w-3 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{mission.from.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{mission.from.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <MapPin className="h-3 w-3 text-red-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{mission.to.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{mission.to.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Aucune mission planifiée pour cette journée</p>
                <Button className="mt-4" size="sm" onClick={() => changeDate(-1)}>
                  Voir le jour précédent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
