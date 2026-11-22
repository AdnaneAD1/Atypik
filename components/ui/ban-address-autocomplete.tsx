'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { LoaderDots } from '@/components/ui/loader';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface BanAddressResult {
  address: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
}

interface BanFeature {
  properties: {
    label: string;
    city: string;
    postcode: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface BanAddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: BanAddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const BAN_API_URL = 'https://data.geopf.fr/geocodage/search';

export function BanAddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Saisissez une adresse...',
  disabled = false,
  className,
}: BanAddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(
        `${BAN_API_URL}?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`,
        { signal: ctrl.signal }
      );
      if (!res.ok) throw new Error('BAN API error');
      const data = await res.json();
      const features: BanFeature[] = data.features ?? [];
      setSuggestions(features);
      setOpen(features.length > 0);
      setHighlighted(-1);
    } catch {
      if (!ctrl.signal.aborted) {
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    clearTimeout(debounceRef.current);
    const q = newValue.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 200);
  };

  const selectSuggestion = (feature: BanFeature) => {
    const { label, city, postcode } = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;
    onChange(label);
    onSelect?.({ address: label, city, postcode, lat, lng });
    setSuggestions([]);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Empêche la soumission du formulaire — Enter sert à choisir une suggestion
      e.preventDefault();
      if (open && highlighted >= 0 && suggestions[highlighted]) {
        selectSuggestion(suggestions[highlighted]);
      }
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Nettoyage : annuler debounce et requête en cours
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-activedescendant={highlighted >= 0 ? `ban-option-${highlighted}` : undefined}
        className={cn('pl-10', className)}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        {loading ? (
          <LoaderDots />
        ) : (
          <MapPin className="h-[18px] w-[18px]" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-md max-h-60 overflow-y-auto"
        >
          {suggestions.map((feature, index) => (
            <li key={`${feature.properties.label}-${index}`} role="presentation">
              <button
                id={`ban-option-${index}`}
                type="button"
                role="option"
                aria-selected={highlighted === index}
                className={cn(
                  'w-full px-3 py-2.5 text-left flex items-start gap-2.5 transition-colors',
                  highlighted === index ? 'bg-accent' : 'hover:bg-muted'
                )}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => selectSuggestion(feature)}
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-sm leading-snug">{feature.properties.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
