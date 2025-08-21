'use client';

import { useState } from 'react';
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
import { AddChildData } from '@/hooks/use-children';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadImageToCloudinary, validateFile } from '@/hooks/use-cloudinary';

const formSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  age: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 18, {
    message: "L'âge doit être un nombre entre 1 et 17",
  }),
  school: z.string().min(2, "Le nom de l'école est requis"),
  specialNeeds: z.string().optional(),
  personality: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddChild?: (data: AddChildData) => void;
}

export function AddChildDialog({ open, onOpenChange, onAddChild }: AddChildDialogProps) {
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      age: '',
      school: '',
      specialNeeds: '',
      personality: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSelectAvatar: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateFile(file, 5 * 1024 * 1024, ['image/']);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (err: any) {
      toast({ title: 'Fichier invalide', description: err?.message || 'Image non valide', variant: 'destructive' });
    }
  };

  const onRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Simule un délai d'ajout
      await new Promise(resolve => setTimeout(resolve, 300));
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadImageToCloudinary(avatarFile);
      }
      
      if (onAddChild) {
        const payload: AddChildData = { ...data, avatarUrl };
        onAddChild(payload);
      }
      
      toast({
        title: 'Enfant ajouté',
        description: 'Le profil a été créé avec succès',
      });
      
      form.reset();
      onRemoveAvatar();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'ajout",
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un enfant</DialogTitle>
          <DialogDescription>
            Renseignez les informations de votre enfant pour créer son profil.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar uploader */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Photo de l'enfant" />
                ) : (
                  <AvatarFallback>ENF</AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <label htmlFor="child-avatar-input">
                    <input id="child-avatar-input" type="file" accept="image/*" className="hidden" onChange={onSelectAvatar} />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('child-avatar-input')?.click()}>
                      Choisir une photo
                    </Button>
                  </label>
                  {avatarFile && (
                    <Button type="button" variant="ghost" onClick={onRemoveAvatar}>Retirer</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, max 5MB (optionnel).</p>
              </div>
            </div>

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
                    <FormLabel>Nom du centre hospitalier</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du centre hospitalier" {...field} />
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

            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personnalité de l&apos;enfant (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Timide, extraverti, curieux, calme, énergique..." 
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
                  'Ajouter'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
