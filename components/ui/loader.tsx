'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/* =====================================================
   Loaders Atypik Driver — trois variantes de marque
   1. <CarLoader />     : voiture qui roule (bloc / page)
   2. <LoaderDots />    : trois points (boutons, actions)
   3. <FullScreenLoader /> : overlay plein écran, messages rotatifs
   ===================================================== */

const TAXI_SVG = (
  <svg viewBox="0 0 240 90" aria-hidden="true" focusable="false">
    <line className="ld-road" x1="0" x2="240" y1="80" y2="80" stroke="#b8c3d1" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 14" />
    <g stroke="#b8c3d1" strokeWidth="3" strokeLinecap="round">
      <line className="ld-speed" x1="42" x2="58" y1="38" y2="38" />
      <line className="ld-speed" x1="34" x2="54" y1="52" y2="52" />
      <line className="ld-speed" x1="46" x2="60" y1="66" y2="66" />
    </g>
    <g className="ld-car" transform="translate(66 4)">
      <g stroke="#101828" strokeWidth="2.5" strokeLinejoin="round">
        <rect x="40" y="2" width="22" height="7" rx="2" fill="#101828" />
        <path d="M20 30 L30 12 H74 L86 30 Z" fill="#ffc21a" />
        <rect x="2" y="28" width="104" height="26" rx="9" fill="#ffc21a" />
        <path d="M31 28 L38 15 H50 V28 Z" fill="#e7f2ff" />
        <path d="M55 15 H70 L79 28 H55 Z" fill="#e7f2ff" />
      </g>
      <circle cx="44" cy="24" r="4.6" fill="#d63a24" />
      <circle cx="66" cy="24" r="4.6" fill="#14949b" />
      <rect x="3" y="28" width="103" height="3" fill="#ffc21a" />
      <circle cx="100" cy="40" r="3.4" fill="#fff6d9" stroke="#101828" strokeWidth="1.5" />
      <g>
        <circle cx="28" cy="56" r="10" fill="#101828" />
        <g className="ld-wheel"><circle cx="28" cy="56" r="4" fill="#fff" /><line x1="28" y1="49.5" x2="28" y2="62.5" stroke="#101828" strokeWidth="2" /></g>
        <circle cx="82" cy="56" r="10" fill="#101828" />
        <g className="ld-wheel"><circle cx="82" cy="56" r="4" fill="#fff" /><line x1="82" y1="49.5" x2="82" y2="62.5" stroke="#101828" strokeWidth="2" /></g>
      </g>
    </g>
  </svg>
);

interface CarLoaderProps {
  /** Texte affiché sous la voiture */
  message?: string;
  /** Largeur du SVG en px — responsive : jamais plus que 70vw */
  size?: number;
  className?: string;
}

/** Loader de bloc : voiture animée + message. Pour les pages, cartes, listes. */
export function CarLoader({ message, size = 200, className }: CarLoaderProps) {
  return (
    <div className={cn('ld', className)} role="status" aria-live="polite">
      <div style={{ width: size, maxWidth: '70vw' }}>{TAXI_SVG}</div>
      {message ? <p className="ld-msg">{message}</p> : null}
    </div>
  );
}

const DEFAULT_MESSAGES = [
  'On prépare votre trajet',
  'On vérifie l’itinéraire',
  'On y est presque',
];

interface FullScreenLoaderProps {
  /** Messages qui défilent sous la voiture (défaut : trajet) */
  messages?: string[];
  /** Intervalle de rotation des messages (ms) */
  interval?: number;
}

/** Loader plein écran avec overlay flouté et messages rotatifs. */
export function FullScreenLoader({ messages = DEFAULT_MESSAGES, interval = 2200 }: FullScreenLoaderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), interval);
    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <div className="ld-overlay" role="status" aria-live="polite">
      <div className="ld">
        <div style={{ width: 240, maxWidth: '70vw' }}>{TAXI_SVG}</div>
        <p className="ld-msg">{messages[index]}</p>
      </div>
    </div>
  );
}

interface LoaderDotsProps {
  className?: string;
  /** Taille grande pour les états centraux de boutons principaux */
  large?: boolean;
}

/** Trois points aux couleurs de la marque — pour boutons et actions inline. */
export function LoaderDots({ className, large }: LoaderDotsProps) {
  return (
    <span className={cn('ld-dots', large && 'ld-dots-lg', className)} role="status" aria-label="Chargement">
      <i /><i /><i />
    </span>
  );
}

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Compatibilité ascendante : sm → points (boutons), md/lg → voiture de marque.
 * Préférer CarLoader / LoaderDots / FullScreenLoader directement.
 */
export function Loader({ size = 'md', className }: LoaderProps) {
  if (size === 'sm') {
    return <LoaderDots className={className} />;
  }
  return <CarLoader size={size === 'lg' ? 200 : 140} className={className} />;
}
