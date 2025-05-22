'use client';

import { Card } from "@/components/ui/card";

import { useAuth } from '@/lib/auth/auth-context';
import { useMessages } from '@/hooks/use-messages';
import { DriverConversationList } from './driver-conversation-list';
import { NewConversationDialog } from './new-conversation-dialog';
import { DriverChatHeader } from './driver-chat-header';
import { DriverMessageList } from './driver-message-list';
import { DriverMessageInput } from './driver-message-input';
import { useState, useMemo, useEffect } from 'react';
import { Message } from '@/hooks/use-messages';

export function DriverMessages() {
  const { user } = useAuth();
  const userId = user?.id;
  const userAvatar = user?.avatar;
  const { conversations, messages, loading, sendMessage, markMessagesAsRead, loadMessages, createConversation } = useMessages();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [loadingNewConversation, setLoadingNewConversation] = useState(false);

  // Conversation sélectionnée
  const selectedConversation = useMemo(() =>
    conversations.find(c => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  // Marquer comme lu à chaque ouverture
  useEffect(() => {
    if (selectedConversationId && selectedConversation) {
      markMessagesAsRead(selectedConversationId);
    }
  }, [selectedConversationId, selectedConversation, markMessagesAsRead]);

  // Gestion de l'envoi de message avec pièces jointes et reply
  const handleSendMessage = async (content: string, files: File[]) => {
    if (!selectedConversationId) return;
    setIsUploading(files.length > 0);
    setUploadProgress(0);
    try {
      await sendMessage(
        selectedConversationId,
        content,
        files,
        replyingTo || undefined
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setReplyingTo(null);
    }
  };

  // Création d'une nouvelle conversation
  const handleCreateConversation = async (parentIds: string[]) => {
    if (!userId || parentIds.length === 0) return;
    setLoadingNewConversation(true);
    try {
      const conversationId = await createConversation(parentIds);
      if (conversationId) {
        setSelectedConversationId(conversationId);
        setShowNewConversationDialog(false);
        setReplyingTo(null);
      }
    } finally {
      setLoadingNewConversation(false);
    }
  };

  // Gestion du reply depuis la liste
  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
  };

  // Gestion annulation du reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Gestion du téléchargement des pièces jointes
  const handleDownloadAttachment = (url: string, filename: string) => {
    // Déclenche le téléchargement du fichier (simple)
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-950 rounded-lg shadow overflow-hidden">
      <DriverConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        onNewConversation={() => setShowNewConversationDialog(true)}
        currentUserId={userId ?? ""}
      />
      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        onCreateConversation={handleCreateConversation}
        loading={loadingNewConversation}
      />
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <DriverChatHeader conversation={selectedConversation} currentUserId={userId ?? ""} />
            <DriverMessageList
              messages={messages}
              currentUserId={userId ?? ""}
              currentUserAvatar={userAvatar}
              loading={loading}
              onReplyToMessage={handleReplyToMessage}
              onDeleteMessage={() => {}}
              onDownloadAttachment={handleDownloadAttachment}
            />
            <DriverMessageInput
              onSendMessage={handleSendMessage}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}