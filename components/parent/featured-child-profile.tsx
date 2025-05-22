'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, School, Calendar, Award, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface FeaturedChildProfileProps {
  onViewDetails?: () => void;
}

export function FeaturedChildProfile({ onViewDetails }: FeaturedChildProfileProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  
  // Données fictives pour le profil enfant du jour
  const child = {
    id: '1',
    name: 'Lucas Dubois',
    age: 8,
    school: 'École Montessori Étoile',
    avatar: null,
    achievements: [
      { id: '1', title: 'Premier jour d\'école', date: '15/09/2024' },
      { id: '2', title: '10 trajets sans retard', date: '05/10/2024' },
    ],
    nextEvent: {
      title: 'Transport école',
      date: 'Lundi 12 mai',
      time: '08:15'
    }
  };
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    
    toast({
      title: isLiked ? 'Retiré des favoris' : 'Ajouté aux favoris',
      description: isLiked ? `${child.name} a été retiré de vos favoris` : `${child.name} a été ajouté à vos favoris`,
    });
  };
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      // Navigation alternative si la prop n'est pas fournie
      toast({
        title: 'Détails du profil',
        description: `Affichage des détails du profil de ${child.name}`,
      });
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-background">
      <CardHeader className="pb-0 pt-6">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-base font-bold">Profil enfant du jour</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full ${isLiked ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 pb-6">
        <div className="flex flex-col items-center text-center mb-5">
          <Avatar className="h-20 w-20 mb-3 border-2 border-amber-200 dark:border-amber-800">
            <AvatarImage src={child.avatar || undefined} alt={child.name} />
            <AvatarFallback className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xl font-semibold">
              {child.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="text-lg font-semibold">{child.name}</h3>
          <p className="text-sm text-muted-foreground">{child.age} ans</p>
          
          <div className="flex items-center gap-1.5 mt-2">
            <School className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs">{child.school}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-secondary/40 rounded-lg p-3">
            <h4 className="text-xs font-medium flex items-center gap-1.5 mb-2">
              <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Dernières réalisations</span>
            </h4>
            
            <div className="space-y-2">
              {child.achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between">
                  <p className="text-xs font-medium">{achievement.title}</p>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                    {achievement.date}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-secondary/40 rounded-lg p-3">
            <h4 className="text-xs font-medium flex items-center gap-1.5 mb-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Prochain transport</span>
            </h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">{child.nextEvent.title}</p>
                <p className="text-[10px] text-muted-foreground">{child.nextEvent.date} · {child.nextEvent.time}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                <Calendar className="h-3 w-3 mr-1" />
                Détails
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-5">
          <Button 
            className="w-full text-xs h-9 gap-1"
            onClick={handleViewDetails}
          >
            <User className="h-3.5 w-3.5" />
            Voir le profil complet
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
