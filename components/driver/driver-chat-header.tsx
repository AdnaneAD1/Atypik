"use client";
import { Conversation, Participant } from '@/hooks/use-messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Video } from 'lucide-react';

export function DriverChatHeader({ conversation, currentUserId }: { conversation: Conversation; currentUserId: string }) {
  const other: Participant = conversation.participants.find(p => p.id !== currentUserId) || {
    id: 'unknown', name: 'Inconnu', role: 'Utilisateur', avatar: undefined
  };
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b bg-white dark:bg-gray-950">
      <Avatar className="h-10 w-10">
        <AvatarImage src={other.avatar ? other.avatar : undefined} />
        <AvatarFallback className="bg-primary/10 text-primary">{other.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{other.name}</div>
        <div className="text-xs text-muted-foreground truncate">{other.role}</div>
      </div>
      <button className="p-2 rounded-full hover:bg-primary/10 transition-colors"><Phone className="h-5 w-5 text-primary" /></button>
      <button className="p-2 rounded-full hover:bg-primary/10 transition-colors"><Video className="h-5 w-5 text-primary" /></button>
    </div>
  );
}
