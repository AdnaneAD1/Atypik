'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, CarFront } from 'lucide-react';
import { Conversation, Participant } from '@/hooks/use-messages';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  currentUserId,
  onClick
}: ConversationItemProps) {
  // Obtenir le nom et le rôle de l'autre participant
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
  
  // Obtenir le nombre de messages non lus pour l'utilisateur actuel
  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unreadCount?.[currentUserId] || 0;
  };

  const otherParticipant = getOtherParticipant(conversation);
  const unreadCount = getUnreadCount(conversation);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-l-[3px] p-3 sm:px-4 text-left transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:bg-secondary'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParticipant.avatar ? otherParticipant.avatar : undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherParticipant.role === 'Chauffeur' ? (
                <CarFront className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          {otherParticipant.online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={`truncate font-medium ${unreadCount > 0 ? 'font-semibold' : ''}`}>
              {otherParticipant.name}
            </h3>
            <span className="shrink-0 text-xs text-muted-foreground">
              {conversation.lastMessageTime && formatLastMessageTime(conversation.lastMessageTime)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className={`truncate text-sm ${unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              {conversation.lastMessageSender === currentUserId && 'Vous : '}
              {conversation.lastMessage || 'Aucun message'}
            </p>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
