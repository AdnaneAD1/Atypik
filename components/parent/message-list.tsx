'use client';

import { useRef, useEffect } from 'react';
import { Message } from '@/hooks/use-messages';
import { MessageItem } from './message-item';
import { CarLoader } from '@/components/ui/loader';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  currentUserAvatar?: string;
  loading: boolean;
  onReplyToMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onDownloadAttachment: (url: string, filename: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  currentUserAvatar,
  loading,
  onReplyToMessage,
  onDeleteMessage,
  onDownloadAttachment
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Regroupement des messages par date (jour)
  const groupMessagesByDay = (msgs: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    const sortedMsgs = [...msgs].sort(
      (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    sortedMsgs.forEach(msg => {
      const date = msg.timestamp ? new Date(msg.timestamp).toLocaleDateString('fr-FR') : 'Inconnu';
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };
  const grouped = groupMessagesByDay(messages);
  const sortedDates = Object.keys(grouped);

  // Scroll auto
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-muted/30">
        <CarLoader size={140} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-muted/30">
        <div className="text-center text-muted-foreground max-w-sm mx-auto">
          <p className="text-sm sm:text-base">Aucun message dans cette conversation</p>
          <p className="text-xs sm:text-sm mt-1">Envoyez un message pour démarrer la conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-muted/30 px-2 py-3 sm:px-3 md:px-4 md:py-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="max-w-4xl mx-auto min-h-full">
        {sortedDates.map(date => (
          <div key={date} className="mb-5 sm:mb-7">
            {/* Séparateur de date avec filets */}
            <div className="my-4 flex items-center gap-4 sm:my-5">
              <span className="h-px flex-1 bg-border" />
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {date}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {grouped[date].map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="w-full max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%]">
                    <MessageItem
                      message={message}
                      isCurrentUser={message.senderId === currentUserId}
                      currentUserAvatar={currentUserAvatar}
                      onReply={onReplyToMessage}
                      onDelete={onDeleteMessage}
                      onDownloadAttachment={onDownloadAttachment}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
