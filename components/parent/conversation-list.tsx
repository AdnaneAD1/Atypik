'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Conversation } from '@/hooks/use-messages';
import { ConversationItem } from './conversation-item';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  currentUserId: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
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
      {/* Header fixe */}
      <div className="flex-shrink-0 flex items-center gap-2 p-3 sm:p-4 pb-2">
        <h2 className="text-base sm:text-lg font-semibold truncate">Messages</h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {conversations.length}
        </span>
      </div>

      {/* Barre de recherche fixe */}
      <div className="flex-shrink-0 relative px-3 sm:px-4 pb-3 sm:pb-4">
        <Search className="absolute left-6 sm:left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une conversation"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Liste scrollable, items séparés par des filets */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
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
