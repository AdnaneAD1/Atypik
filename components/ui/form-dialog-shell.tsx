'use client';

import { cn } from '@/lib/utils';

/**
 * Classes du DialogContent associé à ce gabarit :
 * plein écran sur mobile (100dvh), carte centrée à partir de sm,
 * et croix de fermeture blanche posée sur le bandeau teal.
 */
export const formDialogContentClass = cn(
  'gap-0 overflow-hidden overflow-y-hidden p-0 sm:max-h-[92dvh]',
  '[&>button]:right-4 [&>button]:top-2 [&>button]:z-10 [&>button]:text-white',
  '[&>button]:opacity-90 [&>button]:transition-opacity hover:[&>button]:opacity-100',
  'focus:[&>button]:ring-2 focus:[&>button]:ring-white'
);

interface FormDialogShellProps {
  /** Texte du bandeau de marque affiché en haut du modal */
  caption: string;
  children: React.ReactNode;
}

/**
 * Gabarit partagé des modals d'ajout/édition :
 * fine bande de marque teal en haut + contenu formulaire scrollable.
 */
export function FormDialogShell({ caption, children }: FormDialogShellProps) {
  return (
    <div>
      {/* Bandeau de marque — fin, sur tous les écrans */}
      <div className="bg-brand-teal px-4 py-2">
        <p className="text-xs font-semibold text-white">{caption}</p>
      </div>

      {/* Contenu du formulaire */}
      <div className="max-h-[calc(100dvh-2.5rem)] overflow-y-auto sm:max-h-[calc(92dvh-2.5rem)]">
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
