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
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useChildren } from '@/hooks/use-children';
import { useAuth } from '@/lib/auth/auth-context';
import { AddressSelector } from '@/components/ui/address-selector';

// Fonction pour comparer les dates sans tenir compte de l'heure
const isSameOrAfterToday = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Créer une copie de la date pour éviter de modifier l'original
  const dateToCompare = new Date(date);
  dateToCompare.setHours(0, 0, 0, 0);
  return dateToCompare >= today;
};

const formSchema = z.object({
  childId: z.string().min(1, 'Veuillez sélectionner un enfant'),
  transportType: z.enum(['aller', 'retour', 'aller-retour']),
  date: z.date().refine(date => isSameOrAfterToday(date), {
    message: 'La date doit être aujourd\'hui ou une date future',
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide'),
  from: z.object({
    address: z.string().min(3, 'Adresse de départ requise'),
    lat: z.number(),
    lng: z.number(),
    placeId: z.string().optional(),
  }),
  to: z.object({
    address: z.string().min(3, 'Adresse d\'arrivée requise'),
    lat: z.number(),
    lng: z.number(),
    placeId: z.string().optional(),
  }),
  distance: z.number().optional(), // en mètres
  childName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Fonction utilitaire pour charger le script Google Maps si besoin
function loadGoogleMapsScript(apiKey: string, callback: () => void) {
  if (typeof window === 'undefined') return;
  if (window.google && window.google.maps && window.google.maps.places) {
    callback();
    return;
  }
  const existingScript = document.getElementById('google-maps-script');
  if (existingScript) {
    existingScript.addEventListener('load', callback);
    return;
  }
  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.onload = callback;
  document.body.appendChild(script);
}


interface TransportEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onAddEvent?: (data: FormValues) => Promise<{ success: boolean; message?: string }>;
}

export function TransportEventDialog({ 
  open, 
  onOpenChange, 
  selectedDate = new Date(),
  onAddEvent 
}: TransportEventDialogProps) {
  // Vérifier si la date sélectionnée est une date passée sans modifier l'objet original
  const isPastDate = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateToCompare = new Date(selectedDate);
    dateToCompare.setHours(0, 0, 0, 0);
    
    return dateToCompare < today;
  })();
  
  // Utiliser la date sélectionnée telle quelle (même si c'est une date passée)
  // pour afficher la date correcte dans le dialogue, mais empêcher la soumission si c'est une date passée
  const { toast } = useToast();
  const { children, isLoading: loadingChildren } = useChildren();
  const { user } = useAuth();
  
  const [from, setFrom] = useState<{ address: string; lat: number; lng: number; placeId?: string } | null>(null);
  const [to, setTo] = useState<{ address: string; lat: number; lng: number; placeId?: string } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Charger Google Maps script si besoin (clé à placer dans .env.local)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    loadGoogleMapsScript(apiKey, () => setMapsLoaded(true));
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childId: '',
      transportType: 'aller-retour',
      date: selectedDate,
      time: '08:00',
      from: { address: '', lat: 0, lng: 0 },
      to: { address: '', lat: 0, lng: 0 },
      distance: undefined,
    },
  });

  const { isSubmitting } = form.formState;

  // Calcul de la distance avec Google Maps Distance Matrix
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!mapsLoaded || !from || !to) return;
    if (!from.lat || !from.lng || !to.lat || !to.lng) return;
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [{ lat: from.lat, lng: from.lng }],
        destinations: [{ lat: to.lat, lng: to.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response && response.rows[0]?.elements[0]?.status === 'OK') {
          const distanceValue = response.rows[0].elements[0].distance.value; // en mètres
          setDistance(distanceValue);
          form.setValue('distance', distanceValue);
          console.log('Distance calculée:', distanceValue, 'm');
        } else {
          console.log('Erreur calcul distance:', status, response);
          setDistance(null);
          form.setValue('distance', 0); // Utiliser 0 au lieu de undefined
        }
      }
    );
  }, [from, to, mapsLoaded, form]);

  // Initialiser le formulaire uniquement lorsque le dialogue s'ouvre
  useEffect(() => {
    if (open) {
      // Réinitialiser le formulaire avec les valeurs par défaut mais avec la date sélectionnée
      form.reset({
        childId: '',
        transportType: 'aller-retour',
        date: selectedDate,
        time: '08:00',
      });
    }
  }, [open, selectedDate, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const selectedChild = children?.find(child => child.id === data.childId);
      const childName = selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'Enfant';

      if (!from || !to) {
        toast({ title: 'Adresse manquante', description: 'Merci de renseigner le lieu de départ et d\'arrivée valides.' });
        return;
      }
      
      // Vérifier que la distance a été calculée
      if (distance === null || distance === undefined) {
        toast({ title: 'Distance non calculée', description: 'Veuillez attendre le calcul de la distance ou vérifier les adresses.' });
        return;
      }

      if (onAddEvent) {
        // Utiliser la distance calculée (qui peut être 0 pour des adresses très proches)
        const transportData = {
          ...data,
          childName,
          from,
          to,
          distance: distance // Utiliser directement la distance calculée
        };
        
        console.log('Données envoyées:', transportData); // Debug
        const result = await onAddEvent(transportData);
        if (result && (result as any).success) {
          toast({
            title: 'Transport programmé',
            description: (result as any).message || 'Le transport a été ajouté au calendrier',
          });

          // Envoyer une notification push au chauffeur sélectionné (best effort)
          try {
            if (user?.selectedDriverId) {
              const notifTitle = 'Transport programmé';
              const notifBody = `${childName} • ${data.transportType} le ${format(data.date, 'dd/MM/yyyy', { locale: fr })} à ${data.time}`;
              await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.selectedDriverId,
                  title: notifTitle,
                  body: notifBody,
                  data: {
                    type: 'transport',
                    childId: data.childId,
                    date: data.date.toISOString(),
                    time: data.time,
                    transportType: data.transportType,
                  },
                }),
              });
            }
          } catch (e) {
            console.error('Erreur envoi notification push:', e);
          }

          form.reset();
          setFrom(null); setTo(null); setDistance(null);
          onOpenChange(false);
        } else {
          toast({
            title: 'Erreur',
            description: (result as any)?.message || 'Le transport n\'a pas pu être ajouté.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la programmation',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Programmer un transport</DialogTitle>
          <DialogDescription className="flex flex-col space-y-1">
            <span>Pour le {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : ''}</span>
            {isPastDate && (
              <span className="text-destructive font-medium text-xs">
                Cette date est déjà passée. Vous ne pouvez pas programmer de transport pour cette date.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="childId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enfant</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un enfant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingChildren ? (
                        <SelectItem value="loading" disabled>
                          Chargement des enfants...
                        </SelectItem>
                      ) : children && children.length > 0 ? (
                        children.map((child) => (
                          <SelectItem key={child.id} value={child.id ?? ""}>
                            {child.firstName} {child.lastName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-children" disabled>
                          Aucun enfant disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de transport</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="aller-retour">Aller-Retour</SelectItem>
                      <SelectItem value="aller">Aller (matin)</SelectItem>
                      <SelectItem value="retour">Retour (après-midi)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de prise en charge</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ Lieu de départ */}
            <AddressSelector
              value={from?.address || ''}
              onChange={val => {
                const newFrom = val ? { address: val, lat: 0, lng: 0 } : null;
                setFrom(newFrom);
                form.setValue('from', newFrom || { address: '', lat: 0, lng: 0 });
              }}
              onSelect={res => {
                setFrom(res);
                form.setValue('from', res);
              }}
              placeholder="Adresse de départ"
              restrictRegion={process.env.NEXT_PUBLIC_REGION_CODE || 'FR'}
              disabled={!mapsLoaded}
              label="Lieu de départ"
            />
            
            {/* Champ Lieu d&apos;arrivée */}
            <AddressSelector
              value={to?.address || ''}
              onChange={val => {
                const newTo = val ? { address: val, lat: 0, lng: 0 } : null;
                setTo(newTo);
                form.setValue('to', newTo || { address: '', lat: 0, lng: 0 });
              }}
              onSelect={res => {
                setTo(res);
                form.setValue('to', res);
              }}
              placeholder="Adresse d&apos;arrivée (France)"
              restrictRegion="FR"
              disabled={!mapsLoaded}
              label="Lieu d&apos;arrivée"
            />
            {/* Distance affichée */}
            {distance !== null && distance !== undefined && (
              <div className="text-sm text-primary mt-2">
                Distance estimée : {(distance / 1000).toFixed(2)} km
              </div>
            )}


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || isPastDate}>
                {isSubmitting ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Enregistrement...
                  </>
                ) : isPastDate ? (
                  'Date passée'
                ) : (
                  'Programmer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
