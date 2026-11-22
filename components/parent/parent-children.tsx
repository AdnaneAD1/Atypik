'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExpandableTag } from '@/components/ui/expandable-tag';
import { Plus, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { CarLoader } from '@/components/ui/loader';
import { motion } from 'framer-motion';
import { AddChildDialog } from './add-child-dialog';
import { EditChildDialog } from './edit-child-dialog';
import { useToast } from '@/hooks/use-toast';
import { useChildren, AddChildData, Child } from '@/hooks/use-children';

// Rotation des teintes de marque pour les cartes enfants
const CARD_TINTS = [
  { card: 'bg-brand-yellow/15', avatar: 'bg-brand-yellow text-slate-900' },
  { card: 'bg-brand-teal/10', avatar: 'bg-brand-teal text-white' },
  { card: 'bg-primary/10', avatar: 'bg-primary text-white' },
  { card: 'bg-brand-pink/15', avatar: 'bg-brand-pink text-white' },
];

export function ParentChildren() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  
  // Utiliser le hook useChildren pour gérer les enfants
  const { children, isLoading, error, addChild, updateChild, deleteChild } = useChildren();
  
  // Fonction pour ajouter un nouvel enfant
  const handleAddChild = async (data: AddChildData) => {
    await addChild(data);
  };
  
  // Fonction pour ouvrir le dialogue de modification
  const handleEditClick = (child: Child) => {
    setSelectedChild(child);
    setIsEditDialogOpen(true);
  };
  
  // Fonction pour modifier un enfant
  const handleEditChild = async (id: string, data: any) => {
    try {
      const updatedChild = {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        age: parseInt(data.age),
        school: data.school,
        needs: data.specialNeeds ? data.specialNeeds.split(',').map((need: string) => need.trim()) : [],
        personality: data.personality || '', // ✅ Ajout de la personnalité
        ...(data.avatarUrl !== undefined ? { avatar: data.avatarUrl } : {}),
      };
      
      return await updateChild(id, updatedChild);
    } catch (error) {
      console.error('Erreur lors de la modification de l\'enfant:', error);
      return false;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes enfants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les profils de vos enfants
          </p>
        </div>
        <Button
          className="h-10 w-full bg-primary hover:bg-primary/90 sm:w-auto"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter un enfant
        </Button>
      </div>
      
      {/* Dialog pour ajouter un enfant */}
      <AddChildDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onAddChild={handleAddChild}
      />
      
      {/* Dialog pour modifier un enfant */}
      <EditChildDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        onEditChild={handleEditChild}
        child={selectedChild}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <CarLoader size={160} />
            <p className="mt-4 text-sm text-muted-foreground">Chargement des profils...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="mt-4 text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-12 text-center sm:flex-row sm:text-left">
          <div className="h-28 w-[102px] shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
          </div>
          <div>
            <p className="text-sm font-medium">Vous n&apos;avez pas encore ajouté d&apos;enfant</p>
            <p className="mt-1 text-sm text-muted-foreground">Créez un premier profil pour programmer un transport</p>
            <Button
              className="mt-3 bg-primary hover:bg-primary/90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un enfant
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {children.map((child, index) => {
            const tint = CARD_TINTS[index % CARD_TINTS.length];
            return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`rounded-2xl border-0 shadow-none ${tint.card}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-row items-start gap-3 sm:gap-4">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                      <AvatarImage src={child.avatar || undefined} alt={child.name} />
                      <AvatarFallback className={`text-lg sm:text-xl font-bold ${tint.avatar}`}>
                        {child.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 w-full min-w-0">
                      <div className="flex flex-row items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{child.name}</h3>
                          <p className="text-xs sm:text-sm text-slate-600">
                            {child.age} ans, {child.school}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-white/70 text-slate-700 hover:bg-white"
                            onClick={() => handleEditClick(child)}
                            aria-label={`Modifier ${child.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-white/70 text-primary hover:bg-white"
                            onClick={async () => {
                              if (child.id && confirm(`Êtes-vous sûr de vouloir supprimer ${child.name} ?`)) {
                                await deleteChild(child.id);
                              }
                            }}
                            aria-label={`Supprimer ${child.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Besoins — bloc blanc façon référence */}
                      <div className="mt-3 rounded-xl bg-white/70 px-3.5 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Besoins spécifiques
                        </p>
                        {child.needs && child.needs.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {child.needs.map((need, needIndex) => (
                              <ExpandableTag key={needIndex} text={need} />
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">Aucun besoin renseigné</p>
                        )}
                      </div>

                      {/* Personnalité — sous filet */}
                      <div className="mt-3 border-t border-slate-900/10 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Personnalité
                        </p>
                        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                          {child.personality || 'Non renseignée'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
          })}
        </div>
      )}
    </div>
  );
}