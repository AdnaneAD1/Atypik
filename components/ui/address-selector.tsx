'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { MapPin, Navigation, Map, Loader2 } from 'lucide-react';

interface AddressResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface AddressSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  restrictRegion?: string;
  disabled?: boolean;
  label?: string;
}

export function AddressSelector({
  value,
  onChange,
  onSelect,
  placeholder = "Saisissez une adresse...",
  restrictRegion = 'FR',
  disabled = false,
  label = "Adresse"
}: AddressSelectorProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Initialiser les services Google Maps
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
  }, []);

  // Gérer l'autocomplétion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.length > 2 && autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: newValue,
          componentRestrictions: { country: restrictRegion },
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Sélectionner une suggestion
  const handleSuggestionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ['formatted_address', 'geometry', 'place_id']
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
        const result: AddressResult = {
          address: place.formatted_address || prediction.description,
          lat: place.geometry.location?.lat() ?? 0,
          lng: place.geometry.location?.lng() ?? 0,
          placeId: place.place_id || prediction.place_id
        };
        
        onChange(result.address);
        onSelect(result);
        setShowSuggestions(false);
      }
    });
  };

  // Obtenir la position actuelle
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Géocodage inverse pour obtenir l'adresse
        if (window.google && window.google.maps) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsLoadingLocation(false);
              if (status === 'OK' && results && results[0]) {
                const result: AddressResult = {
                  address: results[0].formatted_address,
                  lat: latitude,
                  lng: longitude,
                  placeId: results[0].place_id || ''
                };
                
                onChange(result.address);
                onSelect(result);
              } else {
                alert('Impossible de déterminer votre adresse');
              }
            }
          );
        } else {
          setIsLoadingLocation(false);
          alert('Google Maps n\'est pas disponible');
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = 'Impossible d\'obtenir votre position';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Géolocalisation refusée. Veuillez autoriser l\'accès à votre position.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé pour la géolocalisation.';
            break;
        }
        
        console.error('Erreur de géolocalisation:', error);
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Initialiser la carte dans le dialog
  const initializeMap = () => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps n\'est pas chargé');
      return;
    }
    
    setIsMapLoaded(false);
    
    // Attendre que le dialog soit ouvert et que l'élément soit dans le DOM
    setTimeout(() => {
      if (!mapRef.current) {
        console.error('Élément de carte non trouvé');
        return;
      }

      const defaultCenter = { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
      
      try {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        // Initialiser le service Places pour la carte
        placesServiceRef.current = new google.maps.places.PlacesService(mapInstanceRef.current);

        // Ajouter un marqueur
        markerRef.current = new google.maps.Marker({
          position: defaultCenter,
          map: mapInstanceRef.current,
          draggable: true,
          title: 'Sélectionnez votre adresse',
          animation: google.maps.Animation.DROP
        });

        // Attendre que la carte soit chargée
        google.maps.event.addListenerOnce(mapInstanceRef.current, 'idle', () => {
          setIsMapLoaded(true);
        });

        // Écouter les clics sur la carte
        mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && markerRef.current) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            markerRef.current.setPosition({ lat, lng });
            
            // Géocodage inverse
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(
              { location: { lat, lng } },
              (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const result: AddressResult = {
                    address: results[0].formatted_address,
                    lat,
                    lng,
                    placeId: results[0].place_id || ''
                  };
                  
                  onChange(result.address);
                  onSelect(result);
                  setIsMapOpen(false);
                }
              }
            );
          }
        });

        // Écouter le drag du marqueur
        markerRef.current.addListener('dragend', () => {
          if (markerRef.current) {
            const position = markerRef.current.getPosition();
            if (position) {
              const lat = position.lat();
              const lng = position.lng();
              
              // Géocodage inverse
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode(
                { location: { lat, lng } },
                (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    const result: AddressResult = {
                      address: results[0].formatted_address,
                      lat,
                      lng,
                      placeId: results[0].place_id || ''
                    };
                    
                    onChange(result.address);
                    onSelect(result);
                  }
                }
              );
            }
          }
        });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
        setIsMapLoaded(true); // Pour éviter un loader infini
      }
    }, 100);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      
      <div className="relative">
        {/* Champ de saisie */}
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Délai pour permettre le clic sur les suggestions
            setTimeout(() => setShowSuggestions(false), 300);
          }}
        />

        {/* Boutons d'action */}
        <div className="absolute right-1 top-1 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={disabled || isLoadingLocation}
            className="h-8 w-8 p-0"
            title="Utiliser ma position"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
          
          <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-8 w-8 p-0"
                title="Sélectionner sur la carte"
                onClick={() => {
                  setIsMapOpen(true);
                  // Initialiser la carte après l'ouverture du dialog
                  setTimeout(initializeMap, 100);
                }}
              >
                <Map className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Sélectionner une adresse sur la carte</DialogTitle>
              </DialogHeader>
              <div className="relative">
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg border"
                  style={{ minHeight: '384px' }}
                />
                {!isMapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Cliquez sur la carte ou déplacez le marqueur pour sélectionner une adresse
              </p>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                onMouseDown={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Adresse sélectionnée */}
      {value && (
        <div className="text-xs text-muted-foreground">
          📍 {value}
        </div>
      )}
    </div>
  );
}
