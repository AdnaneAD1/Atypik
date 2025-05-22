'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { Child } from '@/hooks/use-children';

const formSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  age: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 18, {
    message: "L'âge doit être un nombre entre 1 et 17",
  }),
  school: z.string().min(2, 'Le nom de l\'école est requis'),
  specialNeeds: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditChild?: (id: string, data: FormValues) => Promise<boolean>;
  child: Child | null;
}

export function EditChildDialog({ open, onOpenChange, onEditChild, child }: EditChildDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      age: '',
      school: '',
      specialNeeds: '',
    },
  });

  // Mettre à jour les valeurs du formulaire lorsque l'enfant change
  useEffect(() => {
    if (child) {
      form.reset({
        firstName: child.firstName,
        lastName: child.lastName,
        age: child.age.toString(),
        school: child.school,
        specialNeeds: child.needs ? child.needs.join(', ') : '',
      });
    }
  }, [child, form]);

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: FormValues) => {
    try {
      if (!child?.id || !onEditChild) {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier l\'enfant',
          variant: 'destructive',
        });
        return;
      }
      
      // Appeler la fonction de modification
      const success = await onEditChild(child.id, data);
      
      if (success) {
        toast({
          title: 'Enfant modifié',
          description: 'Les informations ont été mises à jour avec succès',
        });
        
        onOpenChange(false);
      } else {
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la modification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modification',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier un enfant</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;enfant.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Âge</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Âge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>École</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'école" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Besoins spécifiques (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Allergies, médicaments, besoins particuliers..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
