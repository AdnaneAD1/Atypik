"use client";

import { Message } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Reply, Download, User, FileText, Image, Video, Music, Archive, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
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
  const formattedTime = message.timestamp ? format(new Date(message.timestamp), 'HH:mm', { locale: fr }) : '';
  const formattedDate = message.timestamp ? format(new Date(message.timestamp), 'dd MMM', { locale: fr }) : '';

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (filename: string, type?: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeType = type?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
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
            className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-md border whitespace-pre-line break-words text-sm sm:text-base
              ${isCurrentUser
                ? 'bg-red-600 text-white border-red-600 rounded-br-md'
                : 'bg-white text-gray-900 border-gray-200 rounded-bl-md'}
              `}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                {message.content}
              </div>
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
            {/* Pièces jointes */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1 sm:space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-start sm:items-center gap-2 p-2 sm:p-3 rounded-lg bg-background/20 hover:bg-background/30 transition-colors min-w-0">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      {getFileIcon(attachment.name, attachment.type)}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="text-xs sm:text-sm font-medium leading-tight truncate" title={attachment.name}>
                        {/* Troncature intelligente : afficher début + extension si nom trop long */}
                        {attachment.name.length > 25 ? (
                          (() => {
                            const parts = attachment.name.split('.');
                            const extension = parts.length > 1 ? `.${parts.pop()}` : '';
                            const nameWithoutExt = parts.join('.');
                            const maxNameLength = 20 - extension.length;
                            return nameWithoutExt.length > maxNameLength 
                              ? `${nameWithoutExt.substring(0, maxNameLength)}...${extension}`
                              : attachment.name;
                          })()
                        ) : (
                          attachment.name
                        )}
                      </div>
                      {attachment.size && (
                        <div className="text-xs opacity-70 mt-0.5 truncate">{attachment.size}</div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 hover:bg-background/40"
                        onClick={() => handleDownload(attachment.url, attachment.name)}
                        title={`Télécharger ${attachment.name}`}
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Heure */}
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-red-600/80' : 'text-gray-400'} select-none px-1`}>
          <div className="flex flex-wrap items-center gap-1">
            <span>{formattedTime}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{formattedDate}</span>
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
    </div>
  );
}

