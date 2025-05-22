'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Car } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${
        isSelected
          ? 'bg-primary/20 border-primary shadow-sm' // Accentue le fond et ajoute une bordure à gauche
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
          {otherParticipant.online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium truncate ${isSelected ? 'text-primary' : ''}`}>{otherParticipant.name}</h3>
            <span className="text-xs text-muted-foreground">
              {conversation.lastMessageTime && formatLastMessageTime(conversation.lastMessageTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {otherParticipant.role}
            </Badge>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate mt-1">
            {conversation.lastMessageSender ? (
              conversation.lastMessageSender === currentUserId ? (
                <span>
                  <span className="font-medium">Vous: </span>
                  {conversation.lastMessage || 'Aucun message'}
                </span>
              ) : (
                <span>
                  {conversation.lastMessage || 'Aucun message'}
                </span>
              )
            ) : (
              conversation.lastMessage || 'Aucun message'
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
