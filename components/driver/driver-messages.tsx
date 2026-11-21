'use client';

import { Card } from "@/components/ui/card";

import { useAuth } from '@/lib/auth/auth-context';
import { useMessages } from '@/hooks/use-messages';
import { DriverConversationList } from './driver-conversation-list';
import { DriverChatHeader } from './driver-chat-header';
import { DriverMessageList } from './driver-message-list';
import { DriverMessageInput } from './driver-message-input';
import { MessageSquare } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Message } from '@/hooks/use-messages';
import { authFetch } from '@/lib/api/auth-fetch';

export function DriverMessages() {
  const { user } = useAuth();
  const userId = user?.id;
  const userAvatar = user?.avatar;
  const { conversations, messages, loading, sendMessage, markMessagesAsRead, loadMessages, deleteMessage } = useMessages();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  // Sélectionner automatiquement la première conversation disponible si aucune n'est sélectionnée
  // SEULEMENT sur desktop pour éviter la sélection automatique sur mobile
  useEffect(() => {
    // Vérifier si on est sur desktop (largeur d'écran >= 768px)
    const isDesktop = window.innerWidth >= 768;
    if (conversations.length > 0 && !selectedConversationId && isDesktop) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

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

      // Envoyer une notification au correspondant de la conversation
      try {
        const receiver = selectedConversation?.participants?.find((p: any) => p.id !== userId);
        const receiverId = receiver?.id as string | undefined;
        if (receiverId) {
          const title = `Nouveau message de ${user?.name || 'Chauffeur'}`;
          const body = content?.slice(0, 140) || 'Vous avez reçu un nouveau message';
          await authFetch('/api/notifications/send', {
            method: 'POST',
            body: JSON.stringify({
              userId: receiverId,
              title,
              body,
              data: {
                type: 'message',
                conversationId: selectedConversationId,
              },
            }),
          });
        }
      } catch (e) {
        console.error('Erreur envoi notification message (driver):', e);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setReplyingTo(null);
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
    <div className="h-[calc(100vh-8rem)]">
      {/* Une seule surface, filet vertical entre les colonnes */}
      <Card className="grid h-full overflow-hidden rounded-xl border p-0 shadow-none md:grid-cols-[320px_1fr] md:divide-x">

        {/* Liste des conversations */}
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col`}>
          <DriverConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            currentUserId={userId ?? ""}
          />
        </div>

        {/* Zone de chat */}
        <div className={`${selectedConversationId ? 'flex' : 'hidden md:flex'} h-full min-h-0 flex-col`}>
          {selectedConversation ? (
            <>
              <DriverChatHeader
                conversation={selectedConversation}
                currentUserId={userId ?? ""}
                onBack={() => setSelectedConversationId(null)}
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <DriverMessageList
                  messages={messages}
                  currentUserId={userId ?? ""}
                  currentUserAvatar={userAvatar}
                  loading={loading}
                  onReplyToMessage={handleReplyToMessage}
                  onDeleteMessage={deleteMessage}
                  onDownloadAttachment={handleDownloadAttachment}
                />
              </div>
              <div className="flex-shrink-0 border-t">
                <DriverMessageInput
                  onSendMessage={handleSendMessage}
                  replyingTo={replyingTo}
                  onCancelReply={handleCancelReply}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium">Vos conversations</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sélectionnez une conversation pour afficher les messages
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}