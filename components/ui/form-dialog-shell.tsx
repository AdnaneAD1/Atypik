'use client';

import { cn } from '@/lib/utils';

/**
 * Classes du DialogContent associé à ce gabarit :
 * plein écran sur mobile (100dvh), carte centrée à partir de sm,
 * et croix de fermeture en rond sombre — lisible sur la bannière image.
 */
export const formDialogContentClass = cn(
  'gap-0 overflow-hidden p-0 sm:max-h-[92dvh]',
  '[&>button]:right-3 [&>button]:top-3 [&>button]:z-10',
  '[&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center',
  '[&>button]:rounded-full [&>button]:bg-black/45 [&>button]:p-0 [&>button]:text-white',
  '[&>button]:opacity-100 [&>button]:shadow-sm [&>button]:transition-colors',
  'hover:[&>button]:bg-black/65 focus:[&>button]:ring-2 focus:[&>button]:ring-white'
);

interface FormDialogShellProps {
  /** Image affichée dans le panneau latéral */
  image: string;
  /** Texte du bandeau de marque en bas de l'image */
  caption: string;
  /** Classes additionnelles pour l'image (ex: object-contain pour une illustration) */
  imageClassName?: string;
  /** Classes additionnelles pour le panneau image */
  panelClassName?: string;
  children: React.ReactNode;
}

/**
 * Gabarit partagé des modals d'ajout/édition :
 * panneau image de marque à gauche (bannière en mobile) + contenu formulaire à droite.
 */
export function FormDialogShell({
  image,
  caption,
  imageClassName,
  panelClassName,
  children,
}: FormDialogShellProps) {
  return (
    <div className="grid sm:grid-cols-[250px_1fr]">
      {/* Panneau image — bannière en mobile, colonne en desktop */}
      <div className={cn('relative h-36 shrink-0 sm:h-auto sm:min-h-full', panelClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className={cn('absolute inset-0 h-full w-full object-cover object-top', imageClassName)}
        />
        <div className="absolute inset-x-0 bottom-0 bg-brand-teal px-4 py-2.5">
          <p className="text-xs font-semibold text-white">{caption}</p>
        </div>
      </div>

      {/* Contenu du formulaire */}
      <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto sm:max-h-[92dvh]">
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
