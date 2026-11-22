'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableTagProps {
  text: string;
  /** Seuil de caractères au-delà duquel le tag devient extensible */
  maxChars?: number;
  className?: string;
}

/**
 * Chip sans bordure pour les besoins spécifiques : texte court affiché
 * tel quel ; texte long tronqué avec une icône "info" — un clic déplie
 * le texte complet en place (fonctionne au tactile comme à la souris).
 */
export function ExpandableTag({ text, maxChars = 40, className }: ExpandableTagProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > maxChars;

  const chipClass = cn(
    'inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700',
    className
  );

  if (!isLong) {
    return <span className={chipClass}>{text}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((e) => !e)}
      aria-expanded={expanded}
      title={text}
      className={cn(
        chipClass,
        'cursor-pointer text-left transition-colors hover:bg-slate-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal'
      )}
    >
      <span className={cn(!expanded && 'truncate')}>
        {expanded ? text : `${text.slice(0, maxChars).trimEnd()}…`}
      </span>
      <Info
        aria-hidden="true"
        className={cn('h-3 w-3 shrink-0', expanded ? 'text-brand-teal' : 'text-slate-400')}
      />
    </button>
  );
}
