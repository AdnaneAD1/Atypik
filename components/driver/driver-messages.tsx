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

  // Sélectionner automatiquement la première conversation disponible si aucune n'est sélectionnée
  // SEULEMENT sur desktop pour éviter la sélection automatique sur mobile
  useEffect(() => {
    console.log('Conversations disponibles:', conversations);
    // Vérifier si on est sur desktop (largeur d'écran >= 768px)
    const isDesktop = window.innerWidth >= 768;
    if (conversations.length > 0 && !selectedConversationId && isDesktop) {
      console.log('Sélection automatique de la première conversation (desktop seulement):', conversations[0].id);
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
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Layout mobile : une seule vue à la fois, desktop : grid horizontal */}
      <div className="flex flex-col md:grid md:grid-cols-3 h-full gap-4 md:gap-6">
        {/* Mobile : Liste des conversations OU zone de chat (jamais les deux) */}
        {/* Desktop : Toujours les deux côte à côte */}
        
        {/* Liste des conversations - Visible sur desktop OU sur mobile quand aucune conversation n'est sélectionnée */}
        <div className={`${selectedConversationId ? 'hidden md:block' : 'block'} h-full md:col-span-1`}>
          <Card className="h-full flex flex-col">
            <DriverConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onNewConversation={() => setShowNewConversationDialog(true)}
              currentUserId={userId ?? ""}
            />
          </Card>
        </div>

        {/* Zone de chat - Visible sur desktop OU sur mobile quand une conversation est sélectionnée */}
        <div className={`${selectedConversationId ? 'block' : 'hidden md:block'} flex-1 md:col-span-2 min-h-0`}>
          <Card className="h-full p-0 flex flex-col">
            {selectedConversation ? (
              <div className="flex flex-col h-full">
                {/* Bannière en haut avec bouton retour sur mobile */}
                <div className="flex-shrink-0">
                  <div className="flex items-center md:hidden px-4 py-2 border-b bg-white dark:bg-gray-900">
                    <button
                      onClick={() => setSelectedConversationId(null)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition mr-2"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium">Retour aux conversations</span>
                  </div>
                  <DriverChatHeader conversation={selectedConversation} currentUserId={userId ?? ""} />
                </div>
                {/* Liste des messages avec scroll indépendant */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <DriverMessageList
                    messages={messages}
                    currentUserId={userId ?? ""}
                    currentUserAvatar={userAvatar}
                    loading={loading}
                    onReplyToMessage={handleReplyToMessage}
                    onDeleteMessage={() => {}}
                    onDownloadAttachment={handleDownloadAttachment}
                  />
                </div>
                {/* Input toujours en bas */}
                <div className="flex-shrink-0 border-t bg-white dark:bg-gray-900 px-2 py-2">
                  <DriverMessageInput
                    onSendMessage={handleSendMessage}
                    replyingTo={replyingTo}
                    onCancelReply={handleCancelReply}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">Sélectionnez une conversation ou créez-en une nouvelle</p>
                  <button
                    onClick={() => setShowNewConversationDialog(true)}
                    className="mt-4 flex items-center mx-auto gap-2 text-primary hover:underline text-sm sm:text-base"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouvelle conversation
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      
      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        onCreateConversation={handleCreateConversation}
        loading={loadingNewConversation}
      />
    </div>
  );
}