"use client";

import { Message, MessageAttachment } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Reply, Download, User, FileText, Image as ImageIcon, Video, Music, Archive, MoreHorizontal, Trash2, Play } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { DriverMediaViewer } from './driver-media-viewer';
import { DocumentViewer } from '@/components/ui/document-viewer';
import { getFileKind } from '@/lib/files/file-kind';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DriverMessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  currentUserAvatar?: string;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onDownloadAttachment: (url: string, filename: string) => void;
}

export function DriverMessageItem({
  message,
  isCurrentUser,
  currentUserAvatar,
  onReply,
  onDelete,
  onDownloadAttachment
}: DriverMessageItemProps) {
  const { toast } = useToast();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [docViewer, setDocViewer] = useState<MessageAttachment | null>(null);
  const formattedTime = message.timestamp ? format(new Date(message.timestamp), 'HH:mm', { locale: fr }) : '';

  // `type` stocké peut être un MIME (image/jpeg), une extension (JPG) ou vide —
  // getFileKind tranche aussi via l'extension de l'URL/nom du fichier
  const kindOf = (a: MessageAttachment) => getFileKind({ name: a.name, url: a.url, type: a.type });
  const isVideo = (a: MessageAttachment) => kindOf(a) === 'video';
  const isPdf = (a: MessageAttachment) => kindOf(a) === 'pdf';
  const isMedia = (a: MessageAttachment) => ['image', 'video'].includes(kindOf(a));
  const mediaAttachments = (message.attachments ?? []).filter(isMedia);
  const fileAttachments = (message.attachments ?? []).filter(a => !isMedia(a));
  // >3 médias : 2 vignettes + tuile "+N" ; ≤3 : toutes les vignettes
  const showCounter = mediaAttachments.length > 3;
  const visibleMedia = showCounter ? mediaAttachments.slice(0, 2) : mediaAttachments;
  const hiddenMediaCount = mediaAttachments.length - visibleMedia.length;
  const singleMedia = mediaAttachments.length === 1;

  const formatSize = (size?: number | string) => {
    if (size === undefined || size === null) return '';
    if (typeof size === 'string') return size;
    if (size >= 1_048_576) return `${(size / 1_048_576).toFixed(1)} Mo`;
    return `${Math.max(1, Math.round(size / 1024))} Ko`;
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (filename: string, type?: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeType = type?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension || '')) {
      return <Video className="h-4 w-4" />;
    }
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(extension || '')) {
      return <Music className="h-4 w-4" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <Archive className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  // Fonction de téléchargement améliorée
  const handleDownload = async (url: string, filename: string) => {
    try {
      // Vérifier si l'URL est valide
      if (!url || !filename) {
        throw new Error('URL ou nom de fichier manquant');
      }

      // Essayer d'abord le téléchargement direct pour les URLs externes
      if (url.startsWith('http') && !url.includes(window.location.origin)) {
        // Pour les URLs externes (Cloudinary, etc.), utiliser le téléchargement direct
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Téléchargement initié',
          description: `Le téléchargement de "${filename}" a été lancé`,
        });
        return;
      }

      // Pour les URLs locales, utiliser fetch
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer après un délai
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      toast({
        title: 'Téléchargement réussi',
        description: `Le fichier "${filename}" a été téléchargé`,
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      
      // Fallback amélioré : essayer le téléchargement direct
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Téléchargement alternatif',
          description: `Le fichier "${filename}" s'ouvre dans un nouvel onglet`,
        });
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        toast({
          title: 'Erreur de téléchargement',
          description: 'Impossible de télécharger le fichier. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className={`flex w-full py-1 px-2 sm:px-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {isCurrentUser ? null : (
        <div className="flex-shrink-0 mr-2 sm:mr-3">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className={`flex flex-col w-full max-w-[85vw] sm:max-w-[75vw] md:max-w-[65vw] lg:max-w-[60%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Bloc de réponse si replyTo */}
        {message.replyTo && (
          <div className={`text-xs text-muted-foreground mb-1 px-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-1 flex-wrap">
              <Reply className="h-3 w-3 flex-shrink-0" />
              <span className="break-words">Réponse à: {message.replyTo.content.substring(0, 25)}{message.replyTo.content.length > 25 ? '...' : ''}</span>
            </div>
          </div>
        )}
        {/* Contenu du message */}
        <div className="relative group">
          <div
            className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm border whitespace-pre-line break-words text-sm sm:text-base
              ${isCurrentUser
                ? 'bg-primary text-primary-foreground border-primary rounded-br-md'
                : 'bg-card text-card-foreground rounded-bl-md'}
              `}
          >
            <div className="flex justify-between items-start gap-2">
              {message.content && (
                <div className="flex-1 min-w-0">
                  {message.content}
                </div>
              )}
              {/* Menu d'actions pour tous les messages */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-1 hover:bg-background/20 text-current"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => onReply(message)}
                      className="flex items-center gap-2"
                    >
                      <Reply className="h-4 w-4" />
                      Répondre
                    </DropdownMenuItem>
                    {/* Option supprimer uniquement pour ses propres messages */}
                    {isCurrentUser && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
                            onDelete(message.id);
                          }
                        }}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* Médias : aperçu direct, au-delà de 3 → 2 vignettes + tuile "+N" */}
            {mediaAttachments.length > 0 && (
              <div
                className={cn(
                  'mt-2 grid gap-1.5',
                  singleMedia ? 'grid-cols-1' : 'grid-cols-3'
                )}
              >
                {visibleMedia.map((media, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setViewerIndex(i)}
                    className={cn(
                      'group relative overflow-hidden rounded-lg bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'aspect-[4/3]',
                      singleMedia && 'max-h-72 w-full'
                    )}
                    aria-label={`Ouvrir ${media.name}`}
                  >
                    {isVideo(media) ? (
                      <>
                        <video src={media.url} className="h-full w-full object-cover" muted preload="metadata" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
                          <Play className="h-7 w-7 fill-white text-white" />
                        </span>
                      </>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={media.url}
                        alt={media.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                  </button>
                ))}
                {showCounter && (
                  <button
                    type="button"
                    onClick={() => setViewerIndex(2)}
                    className="flex aspect-[4/3] items-center justify-center rounded-lg bg-neutral-900 text-lg font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Voir ${hiddenMediaCount} médias supplémentaires`}
                  >
                    +{hiddenMediaCount}
                  </button>
                )}
              </div>
            )}

            {/* Fichiers non-média : carte compacte */}
            {fileAttachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {fileAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg bg-background/20 p-2.5 min-w-0',
                      isPdf(attachment) && 'cursor-pointer transition-colors hover:bg-background/30'
                    )}
                    onClick={isPdf(attachment) ? () => setDocViewer(attachment) : undefined}
                    title={isPdf(attachment) ? `Ouvrir ${attachment.name}` : undefined}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background/40">
                      {getFileIcon(attachment.name, attachment.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs sm:text-sm font-medium" title={attachment.name}>
                        {attachment.name}
                      </p>
                      {formatSize(attachment.size) && (
                        <p className="text-xs opacity-70">{formatSize(attachment.size)}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 flex-shrink-0 p-0 hover:bg-background/40"
                      onClick={(e) => { e.stopPropagation(); handleDownload(attachment.url, attachment.name); }}
                      title={`Télécharger ${attachment.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Heure dans la bulle, en bas à droite */}
            <div className={cn(
              'mt-1.5 flex justify-end text-[11px] leading-none',
              isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {formattedTime}
            </div>
          </div>
        </div>
      </div>
      {isCurrentUser ? (
        <div className="flex-shrink-0 ml-2 sm:ml-3">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage src={currentUserAvatar ? currentUserAvatar : undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      ) : null}

      {/* Visionneuse média */}
      {viewerIndex !== null && (
        <DriverMediaViewer
          items={mediaAttachments}
          initialIndex={viewerIndex}
          open={viewerIndex !== null}
          onClose={() => setViewerIndex(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Visionneuse de documents (PDF) */}
      {docViewer && (
        <DocumentViewer
          item={docViewer}
          open={docViewer !== null}
          onClose={() => setDocViewer(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

