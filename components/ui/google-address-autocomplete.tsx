import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    if (!inputRef.current) return;

    const options: google.maps.places.AutocompleteOptions = {
      componentRestrictions: restrictRegion ? { country: restrictRegion } : undefined,
      bounds: restrictBounds,
      fields: ['formatted_address', 'geometry', 'place_id'],
      strictBounds: !!restrictBounds,
      types: ['geocode'],
    };
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      if (place.geometry && place.formatted_address) {
        onSelect({
          address: place.formatted_address,
          lat: place.geometry.location?.lat() ?? 0,
          lng: place.geometry.location?.lng() ?? 0,
          placeId: place.place_id ?? '',
        });
      }
    });
    // Nettoyage
    return () => {
      if (autocompleteRef.current) {
        // Pas de méthode officielle pour destroy, mais on peut retirer le listener
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [restrictRegion, restrictBounds, onSelect]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      disabled={disabled}
    />
  );
}
