"use client";

import { useMessages } from '@/hooks/use-messages';
import { DriverConversationItem } from './driver-conversation-item';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DriverConversationListProps {
  conversations: any[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  currentUserId: string;
}

export function DriverConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  currentUserId
}: DriverConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipants = conversation.participants.filter((p: any) => p.id !== currentUserId);
    const participantNames = otherParticipants.map((p: any) => (p.name || '').toLowerCase());
    return participantNames.some((name: string) => name.includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header fixe */}
      <div className="flex-shrink-0 flex items-center justify-between mb-2 p-3 sm:p-4 pb-2">
        <h2 className="text-base sm:text-lg font-semibold truncate">Messages</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onNewConversation}
          className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Barre de recherche fixe */}
      <div className="flex-shrink-0 relative px-3 sm:px-4 pb-3 sm:pb-4">
        <Search className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>
      
      {/* Liste scrollable avec scroll indépendant */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 space-y-1 sm:space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation: any) => (
            <DriverConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              currentUserId={currentUserId}
              onClick={() => onSelectConversation(conversation.id)}
            />
          ))
        )}
        {/* Espacement en bas pour éviter que le dernier élément soit collé */}
        <div className="h-2" />
      </div>
    </div>
  );
}

