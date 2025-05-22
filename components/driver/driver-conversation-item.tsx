"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Car } from 'lucide-react';
import { Conversation, Participant } from '@/hooks/use-messages';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DriverConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}

export function DriverConversationItem({
  conversation,
  isSelected,
  currentUserId,
  onClick
}: DriverConversationItemProps) {
  // Obtenir l'autre participant
  const getOtherParticipant = (conversation: Conversation): Participant => {
    const otherParticipants = conversation.participants.filter(p => p.id !== currentUserId);
    if (otherParticipants.length === 0) {
      return {
        id: 'unknown',
        name: 'Inconnu',
        role: 'Utilisateur',
        online: false,
        avatar: undefined
      };
    }
    return otherParticipants[0];
  };

  // Formater la date du dernier message
  const formatLastMessageTime = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm', { locale: fr });
    } else if (isYesterday(timestamp)) {
      return 'Hier';
    } else {
      return format(timestamp, 'dd/MM', { locale: fr });
    }
  };

  // Nombre de non-lus
  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unreadCount?.[currentUserId] || 0;
  };

  const otherParticipant = getOtherParticipant(conversation);
  const unreadCount = getUnreadCount(conversation);

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${
        isSelected
          ? 'bg-primary/20 border-primary shadow-sm'
          : 'hover:bg-secondary border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParticipant.avatar ? otherParticipant.avatar : undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherParticipant.role === 'Chauffeur' ? (
                <Car className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <span className={`font-medium truncate ${isSelected ? 'text-primary' : ''}`}>{otherParticipant.name}</span>
            {conversation.lastMessageTime && (
              <span className="text-xs text-muted-foreground">
                {formatLastMessageTime(new Date(conversation.lastMessageTime))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{otherParticipant.role}</Badge>
            {unreadCount > 0 && <Badge variant="default" className="text-xs">{unreadCount}</Badge>}
          </div>
          <div className="text-sm text-muted-foreground truncate mt-1">
            {conversation.lastMessageSender === currentUserId
              ? <span><span className="font-medium">Vous: </span>{conversation.lastMessage || 'Aucun message'}</span>
              : conversation.lastMessage || 'Aucun message'}
          </div>
        </div>
      </div>
    </div>
  );
}

