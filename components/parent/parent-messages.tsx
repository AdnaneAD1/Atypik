'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

// Import des hooks personnalisés
import { useMessages } from '@/hooks/use-messages';
import { useCall } from '@/hooks/use-call';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api/auth-fetch';

// Import des composants de messagerie
import { ConversationList } from './conversation-list';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { CallDialog } from './call-dialog';
import { ChatHeader } from './chat-header';

export function ParentMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    conversations, 
    messages, 
    currentConversation, 
    loading, 
    isUploading,
    uploadProgress,
    sendMessage,
    deleteMessage,
    deleteConversation,
    markMessagesAsRead,
    loadMessages
  } = useMessages();
  
  const {
    currentCall,
    callStatus,
    localStream,
    remoteStream,
    initializeCall,
    answerCall,
    rejectCall,
    endCall
  } = useCall();


// États locaux pour la gestion des dialogues et des réponses
  const [isCallDialogOpen, setCallDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Marquer la conversation comme lue à chaque sélection
  useEffect(() => {
    if (selectedConversationId) {
      markMessagesAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markMessagesAsRead]);
  
  // Afficher des informations sur l'utilisateur et l'état d'authentification
  useEffect(() => {
  }, [user]);

  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  // Ouvrir le dialogue d'appel lorsqu'un appel est en cours
  useEffect(() => {
    if (currentCall) {
      setCallDialogOpen(true);
    } else {
      setCallDialogOpen(false);
    }
  }, [currentCall]);

  // Sélectionner automatiquement la première conversation disponible si aucune n'est sélectionnée
  // SEULEMENT sur desktop pour éviter la sélection automatique sur mobile
  useEffect(() => {
    // Vérifier si on est sur desktop (largeur d'écran >= 768px)
    const isDesktop = window.innerWidth >= 768;
    if (conversations.length > 0 && !selectedConversationId && isDesktop) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Gestionnaires d'événements
  const handleSendMessage = async (content: string, attachments: any[] = []) => {
    if (!selectedConversationId) {
      console.error('handleSendMessage: Aucune conversation sélectionnée');
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une conversation',
        variant: 'destructive'
      });
      return;
    }
    
    const messageId = await sendMessage(selectedConversationId, content, attachments, replyingTo);
    setReplyingTo(null);

    // Envoyer une notification au correspondant (autre participant)
    try {
      const conv = conversations.find(c => c.id === selectedConversationId);
      const receiver = conv?.participants?.find((p: any) => p.id !== user?.id);
      const receiverId = receiver?.id;

      if (receiverId) {
        const title = `Nouveau message de ${user?.name || 'Utilisateur'}`;
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
      console.error('Erreur envoi notification message:', e);
    }
  };

  const handleReplyToMessage = (message: any) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId);
  };

  const handleInitiateCall = (type: 'audio' | 'video') => {
    if (selectedConversationId && user) {
      const conversation = conversations.find(c => c.id === selectedConversationId);
      if (conversation) {
        const receiver = conversation.participants.find(p => p.id !== user.id);
        if (receiver) {
          initializeCall(selectedConversationId, receiver.id, receiver.name, type);
          setCallDialogOpen(true);
        }
      }
    }
  };

  const handleAnswerCall = () => {
    if (currentCall) {
      answerCall(currentCall.id);
    }
  };

  const handleRejectCall = () => {
    if (currentCall) {
      rejectCall(currentCall.id);
    }
  };

  const handleEndCall = () => {
    endCall();
  };

  const handleDownloadAttachment = (url: string, filename: string) => {
    window.open(url, '_blank');
  };

  // Vérifier si l'utilisateur actuel est l'appelant
  const isCurrentUserCaller = currentCall ? currentCall.callerId === user?.id : false;

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Une seule surface, filet vertical entre les colonnes */}
      <Card className="grid h-full overflow-hidden rounded-xl border p-0 shadow-none md:grid-cols-[320px_1fr] md:divide-x">

        {/* Liste des conversations */}
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col`}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            currentUserId={user?.id || ''}
          />
        </div>

        {/* Zone de chat */}
        <div className={`${selectedConversationId ? 'flex' : 'hidden md:flex'} h-full min-h-0 flex-col`}>
          {selectedConversationId ? (
            (() => {
              const selectedConversation = conversations.find(c => c.id === selectedConversationId);
              // Trouver le correspondant (différent de l'utilisateur connecté)
              const correspondent = selectedConversation?.participants.find((p: any) => p.id !== user?.id);
              return (
                <>
                  <ChatHeader
                    avatarUrl={correspondent?.avatar || ''}
                    name={correspondent?.name || ''}
                    role={correspondent?.role || ''}
                    online={correspondent?.online}
                    onBack={() => setSelectedConversationId(null)}
                    onCallVoice={() => handleInitiateCall('audio')}
                    onCallVideo={() => handleInitiateCall('video')}
                  />
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <MessageList
                      messages={messages}
                      currentUserId={user?.id || ''}
                      currentUserAvatar={user?.avatar || ''}
                      loading={loading}
                      onReplyToMessage={handleReplyToMessage}
                      onDeleteMessage={handleDeleteMessage}
                      onDownloadAttachment={handleDownloadAttachment}
                    />
                  </div>
                  <div className="flex-shrink-0 border-t">
                    <MessageInput
                      onSendMessage={handleSendMessage}
                      replyingTo={replyingTo}
                      onCancelReply={handleCancelReply}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress}
                    />
                  </div>
                </>
              );
            })()
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

      <CallDialog
        open={isCallDialogOpen}
        onOpenChange={setCallDialogOpen}
        call={currentCall}
        localStream={localStream}
        remoteStream={remoteStream}
        callStatus={callStatus}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        isCurrentUserCaller={isCurrentUserCaller}
      />
    </div>
  );
}