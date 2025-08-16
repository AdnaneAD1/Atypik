"use client";

import { useRef, useEffect } from 'react';
import { Message } from '@/hooks/use-messages';
import { DriverMessageItem } from './driver-message-item';
import { Loader2 } from 'lucide-react';

interface DriverMessageListProps {
  messages: Message[];
  currentUserId: string;
  currentUserAvatar?: string;
  loading: boolean;
  onReplyToMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onDownloadAttachment: (url: string, filename: string) => void;
}

export function DriverMessageList({
  messages,
  currentUserId,
  currentUserAvatar,
  loading,
  onReplyToMessage,
  onDeleteMessage,
  onDownloadAttachment
}: DriverMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Regroupement des messages par date (jour)
  const groupMessagesByDay = (msgs: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    msgs.forEach(msg => {
      const date = msg.timestamp ? new Date(msg.timestamp).toLocaleDateString('fr-FR') : 'Inconnu';
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };
  const grouped = groupMessagesByDay(messages);
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Scroll auto
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-muted-foreground max-w-sm mx-auto">
          <p className="text-sm sm:text-base">Aucun message dans cette conversation</p>
          <p className="text-xs sm:text-sm mt-1">Envoyez un message pour démarrer la conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-2 py-2 sm:px-3 md:px-4 md:py-4 bg-gray-50 dark:bg-gray-900 relative scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="max-w-4xl mx-auto min-h-full">
        {sortedDates.map(date => (
          <div key={date} className="mb-4 sm:mb-6">
            <div className="flex justify-center my-3 sm:my-4">
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm">
                {date}
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2">
              {grouped[date].map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="w-full max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%]">
                    <DriverMessageItem
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

