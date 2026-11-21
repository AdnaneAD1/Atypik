"use client";
import { Conversation, Participant } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, CarFront, User } from 'lucide-react';

interface DriverChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
}

export function DriverChatHeader({ conversation, currentUserId, onBack }: DriverChatHeaderProps) {
  const other: Participant = conversation.participants.find(p => p.id !== currentUserId) || {
    id: 'unknown', name: 'Inconnu', role: 'Utilisateur', avatar: undefined, online: false
  };
  return (
    <div className="flex items-center gap-3 border-b px-3 py-2.5 sm:px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary md:hidden"
          aria-label="Retour aux conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={other.avatar ? other.avatar : undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {other.role === 'Chauffeur' ? <CarFront className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        {other.online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{other.name}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {other.online ? (
            <span className="text-emerald-600 dark:text-emerald-400">En ligne</span>
          ) : (
            <span>{other.role}</span>
          )}
        </div>
      </div>
    </div>
  );
}
