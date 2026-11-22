'use client';

import { useState } from 'react';
import { Heart, AlertTriangle } from 'lucide-react';
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
import { ExpandableTag } from '@/components/ui/expandable-tag';
import { CarLoader } from '@/components/ui/loader';
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
  personality?: string; // ✅ Ajout de la personnalité
  needs?: string[] | ChildNeeds; // ✅ Support des deux formats
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
    <Card className="rounded-xl border shadow-none">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold">Mes enfants</CardTitle>
            <CardDescription className="mt-1">Profils et besoins spécifiques</CardDescription>
          </div>
          <Button
            size="sm"
            className="h-10 shrink-0 bg-primary px-4 text-white hover:bg-primary/90"
            onClick={handleAddChild}
          >
            Ajouter un enfant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <CarLoader size={110} />
          </div>
        ) : childrenData.length > 0 ? (
          <div className="divide-y">
            <AnimatePresence>
              {childrenData.map((child, index) => (
                <motion.div
                  key={child.id}
                  className="group -mx-2 flex cursor-pointer items-center gap-3.5 rounded-lg px-2 py-4 transition-colors active:bg-slate-50"
                  onClick={() => handleShowDetails(child)}
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={child.avatar || undefined} alt={child.name} />
                    <AvatarFallback className={[
                      'bg-brand-yellow font-bold text-slate-900',
                      'bg-primary font-bold text-white',
                      'bg-brand-teal font-bold text-white',
                    ][index % 3]}>
                      {child.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-bold text-slate-900">{child.name}</h4>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {child.age} ans, {child.school}
                    </p>
                    {child.tags && child.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {child.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="h-5 py-0 text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-slate-900 underline underline-offset-4">
                    Voir le profil
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-8 text-center sm:flex-row sm:text-left">
            <div className="h-28 w-[102px] shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
            </div>
            <div>
              <p className="text-sm font-medium">Aucun enfant ajouté</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cliquez sur &quot;Ajouter&quot; pour créer un profil
              </p>
            </div>
          </div>
        )}

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Profil de l&apos;enfant</DialogTitle>
            </DialogHeader>
            
            {selectedChild && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-2 border-brand-yellow">
                    <AvatarImage src={selectedChild.avatar || undefined} alt={selectedChild.name} />
                    <AvatarFallback className="bg-brand-yellow text-lg font-bold text-slate-900">
                      {selectedChild.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
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
                  <p className="text-sm">{selectedChild.personality || 'Aucune personnalité renseignée'}</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Besoins spécifiques
                  </h4>
                  
                  {/* Affichage des besoins sous forme de badges */}
                  {selectedChild.needs && Array.isArray(selectedChild.needs) && selectedChild.needs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedChild.needs.map((need, index) => (
                        <ExpandableTag key={index} text={need} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun besoin spécifique renseigné
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Fermer
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