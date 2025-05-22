'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { Conversation } from '@/hooks/use-messages';
import { ConversationItem } from './conversation-item';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  currentUserId: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  currentUserId
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtrer les conversations en fonction de la recherche
  const filteredConversations = conversations.filter(conversation => {
    const otherParticipants = conversation.participants.filter(p => p.id !== currentUserId);
    const participantNames = otherParticipants.map(p => p.name.toLowerCase());
    return participantNames.some(name => name.includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 p-4 pb-2">
        <h2 className="text-lg font-semibold">Messages</h2>
        <Button variant="ghost" size="icon" onClick={onNewConversation}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="relative px-4 pb-4">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              currentUserId={currentUserId}
              onClick={() => onSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
