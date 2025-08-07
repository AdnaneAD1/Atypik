'use client';

import { useState } from 'react';
import { User, Plus, Heart, Book, Pill, AlarmClock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AddChildDialog } from './add-child-dialog';
import { useToast } from '@/hooks/use-toast';

interface ChildNeeds {
  medication: boolean;
  medicationDetails: string;
  specialSeating: boolean;
  comfortItems: boolean;
  comfortItemsDetails: string;
  allergies: boolean;
  allergiesDetails: string;
}

interface Child {
  id: string;
  name: string;
  age: number;
  school: string;
  grade?: string;
  avatar?: string;
  totalTrips?: number;
  lastTrip?: Date;
  preferences?: any;
  tags?: string[];
  description?: string;
  needs?: ChildNeeds;
}

interface ParentChildListCardProps {
  childrenData?: Child[];
  loading?: boolean;
}

export function ParentChildListCard({ childrenData = [], loading = false }: ParentChildListCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddChild = () => {
    // Redirection vers la page de gestion des enfants
    router.push('/parent/children');
  };

  const handleShowDetails = (child: Child) => {
    setSelectedChild(child);
    setShowDetails(true);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>Mes enfants</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={handleAddChild}
          >
            <Plus className="h-3 w-3" />
            <span>Ajouter</span>
          </Button>
        </CardTitle>
        <CardDescription>
          Profils et besoins spécifiques
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : childrenData.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {childrenData.map((child) => (
                <motion.div
                  key={child.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center p-3 bg-secondary/50 rounded-lg cursor-pointer"
                  onClick={() => handleShowDetails(child)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={child.avatar || undefined} alt={child.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {child.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{child.name}</h4>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {child.age} ans
                      </span>
                      <span className="text-xs text-muted-foreground mx-1">•</span>
                      <span className="text-xs text-muted-foreground">
                        {child.school}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {child.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-[10px] py-0 h-5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun enfant ajouté</p>
            <p className="text-xs text-muted-foreground mt-1">Cliquez sur &quot;Ajouter&quot; pour aller à la page de gestion</p>
          </div>
        )}

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Profil de l&apos;enfant</DialogTitle>
            </DialogHeader>
            
            {selectedChild && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedChild.avatar || undefined} alt={selectedChild.name} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {selectedChild.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="text-xl font-bold">{selectedChild.name}</h3>
                    <p className="text-muted-foreground">
                      {selectedChild.age} ans • {selectedChild.school}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Personnalité et comportement
                  </h4>
                  <p className="text-sm">{selectedChild.description || 'Aucune description disponible'}</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Besoins spécifiques
                  </h4>
                  
                  {selectedChild.needs?.medication && (
                    <div className="flex items-start gap-3 bg-secondary/70 p-3 rounded-lg">
                      <div className="mt-0.5">
                        <Pill className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Médicaments</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedChild.needs.medicationDetails}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedChild.needs?.comfortItems && (
                    <div className="flex items-start gap-3 bg-secondary/70 p-3 rounded-lg">
                      <div className="mt-0.5">
                        <Heart className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Objets réconfortants</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedChild.needs.comfortItemsDetails}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedChild.needs?.allergies && (
                    <div className="flex items-start gap-3 bg-secondary/70 p-3 rounded-lg">
                      <div className="mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Allergies</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedChild.needs.allergiesDetails}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!selectedChild.needs?.medication && 
                   !selectedChild.needs?.comfortItems && 
                   !selectedChild.needs?.allergies && (
                    <p className="text-sm text-muted-foreground">
                      Aucun besoin spécifique enregistré
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Fermer
                  </Button>
                  <Button onClick={() => router.push(`/parent/children/${selectedChild.id}/edit`)}>
                    Modifier le profil
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}