import React, { useRef, useEffect, useState } from 'react';
import { Input } from './input';

interface AddressResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  restrictRegion?: string; // ex: 'FR' ou code région
  restrictBounds?: google.maps.LatLngBoundsLiteral;
  disabled?: boolean;
}

export function GoogleAddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  restrictRegion,
  restrictBounds,
  disabled
}: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Vérifier si Google Maps est chargé
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
      } else {
        // Réessayer dans 100ms
        setTimeout(checkGoogleMaps, 100);
      }
    };
    checkGoogleMaps();
  }, []);

  // Initialiser l'autocomplétion Google Maps
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current || disabled) return;

    try {
      const options: google.maps.places.AutocompleteOptions = {
        componentRestrictions: restrictRegion ? { country: restrictRegion } : undefined,
        bounds: restrictBounds,
        fields: ['formatted_address', 'geometry', 'place_id', 'name'],
        strictBounds: !!restrictBounds,
        types: ['geocode', 'establishment'],
      };

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current, 
        options
      );

      // Écouter les changements de lieu
      const placeChangedListener = () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.formatted_address) {
          const result: AddressResult = {
            address: place.formatted_address,
            lat: place.geometry.location?.lat() ?? 0,
            lng: place.geometry.location?.lng() ?? 0,
            placeId: place.place_id ?? '',
          };
          
          // Mettre à jour la valeur du champ
          onChange(place.formatted_address);
          // Notifier la sélection
          onSelect(result);
        }
      };

      autocompleteRef.current.addListener('place_changed', placeChangedListener);

      // Empêcher la soumission du formulaire avec Enter
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      };

      inputRef.current.addEventListener('keydown', handleKeyDown);

      // Nettoyage
      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        // Capturer la référence pour le cleanup
        const currentInput = inputRef.current;
        if (currentInput) {
          currentInput.removeEventListener('keydown', handleKeyDown);
        }
      };
    } catch (error) {
      console.error('Erreur lors de l&apos;initialisation de Google Places:', error);
    }
  }, [isGoogleMapsLoaded, restrictRegion, restrictBounds, disabled, onChange, onSelect]);

  // Gérer les changements de valeur (saisie manuelle)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Si l'utilisateur tape manuellement, on peut créer un résultat basique
    // sans coordonnées précises (sera géocodé plus tard si nécessaire)
    if (newValue && !autocompleteRef.current) {
      // Fallback pour saisie manuelle sans Google Maps
      const manualResult: AddressResult = {
        address: newValue,
        lat: 0,
        lng: 0,
        placeId: '',
      };
      onSelect(manualResult);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder || "Saisissez une adresse..."}
        autoComplete="off"
        disabled={disabled}
        className="w-full"
      />
      {!isGoogleMapsLoaded && !disabled && (
        <div className="text-xs text-muted-foreground mt-1">
          Chargement de l&apos;autocomplétion...
        </div>
      )}
    </div>
  );
}
