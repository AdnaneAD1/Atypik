'use client';

import { Message } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Reply, MoreHorizontal, Download, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  currentUserAvatar?: string;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onDownloadAttachment: (url: string, filename: string) => void;
}

export function MessageItem({
  message,
  isCurrentUser,
  currentUserAvatar,
  onReply,
  onDelete,
  onDownloadAttachment
}: MessageItemProps) {
  // Formater la date du message
  const formattedTime = message.timestamp ? 
    format(new Date(message.timestamp), 'HH:mm', { locale: fr }) : 
    '';
  const formattedDate = message.timestamp ? 
    format(new Date(message.timestamp), 'dd MMM', { locale: fr }) : 
    '';

  return (
    <div className={`flex w-full py-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar à gauche pour le correspondant, à droite pour l'utilisateur connecté */}
      {isCurrentUser ? null : (
        <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className={`flex flex-col max-w-[80vw] md:max-w-[60%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Message avec réponse */}
        {message.replyTo && (
          <div className={`text-xs text-muted-foreground mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-1">
              <Reply className="h-3 w-3" />
              <span>Réponse à: {message.replyTo.content.substring(0, 30)}{message.replyTo.content.length > 30 ? '...' : ''}</span>
            </div>
          </div>
        )}
        {/* Contenu du message */}
        <div 
          className={`rounded-2xl px-4 py-2 shadow-md border whitespace-pre-line break-words
            ${isCurrentUser 
              ? 'bg-red-600 text-white border-red-600 rounded-br-md' 
              : 'bg-white text-gray-900 border-gray-200 rounded-bl-md'}
            `}
        >
          <div className="mb-1">
            {message.content}
          </div>
          {/* Pièces jointes */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between gap-2 p-2 rounded bg-background/20">
                  <div className="truncate text-sm">{attachment.name}</div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => onDownloadAttachment(attachment.url, attachment.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Heure du message sous la bulle */}
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-red-600/80' : 'text-gray-400'} select-none px-1`}> 
          {formattedTime} • {formattedDate}
          {message.status === 'read' && isCurrentUser && (
            <span className="ml-1">• Lu</span>
          )}
        </div>
      </div>
      {/* Avatar à droite pour l'utilisateur connecté */}
      {isCurrentUser ? (
        <div className="flex-shrink-0 ml-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUserAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      ) : null}
    </div>
  );
}
