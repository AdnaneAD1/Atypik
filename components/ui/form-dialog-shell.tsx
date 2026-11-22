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
  '[&>button]:rounded-full [&>button]:bg-slate-900 [&>button]:p-0 [&>button]:text-white',
  '[&>button]:opacity-100 [&>button]:shadow-sm [&>button]:transition-colors',
  'hover:[&>button]:bg-slate-800 focus:[&>button]:ring-2 focus:[&>button]:ring-slate-900'
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
      {/* Bandeau marque mobile — fin, sans photo (les visages croppent mal en bande fine) */}
      <div className="bg-brand-teal px-4 py-2 sm:hidden">
        <p className="text-xs font-semibold text-white">{caption}</p>
      </div>

      {/* Panneau image — colonne en desktop uniquement */}
      <div className={cn('relative hidden shrink-0 sm:block sm:min-h-full', panelClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className={cn('absolute inset-0 h-full w-full object-cover object-center', imageClassName)}
        />
        <div className="absolute inset-x-0 bottom-0 bg-brand-teal px-4 py-2.5">
          <p className="text-xs font-semibold text-white">{caption}</p>
        </div>
      </div>

      {/* Contenu du formulaire */}
      <div className="max-h-[calc(100dvh-2.5rem)] overflow-y-auto sm:max-h-[92dvh]">
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
