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
  child?: any;
  loading?: boolean;
}

export function FeaturedChildProfile({ child, loading = false }: FeaturedChildProfileProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  
  const handleLike = () => {
    if (!child) return;
    
    setIsLiked(!isLiked);
    
    toast({
      title: isLiked ? 'Retiré des favoris' : 'Ajouté aux favoris',
      description: isLiked ? `${child.name} a été retiré de vos favoris` : `${child.name} a été ajouté à vos favoris`,
    });
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>Enfant du jour</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!child) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>Enfant du jour</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun enfant sélectionné</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>Enfant du jour</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={child.avatar || undefined} alt={child.name} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {child.name?.split(' ').map((n: string) => n[0]).join('') || 'E'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-semibold">{child.name}</h3>
            <p className="text-sm text-muted-foreground">
              {child.age} ans • {child.school}
            </p>
            
            {child.nextTransport && (
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {child.nextTransport.date}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {child.nextTransport.time}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {child.stats && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Statistiques
              </h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-secondary/50 rounded-lg text-center">
                <p className="text-lg font-semibold text-primary">{child.stats.totalTrips || 0}</p>
                <p className="text-xs text-muted-foreground">Trajets</p>
              </div>
              <div className="p-2 bg-secondary/50 rounded-lg text-center">
                <p className="text-lg font-semibold text-green-600">{child.stats.completedTrips || 0}</p>
                <p className="text-xs text-muted-foreground">Terminés</p>
              </div>
            </div>
          </div>
        )}
        

      </CardContent>
    </Card>
  );
}
