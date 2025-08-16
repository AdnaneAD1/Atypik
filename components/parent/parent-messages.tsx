'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

// Import des hooks personnalisés
import { useMessages } from '@/hooks/use-messages';
import { useCall } from '@/hooks/use-call';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';

// Import des composants de messagerie
import { ConversationList } from './conversation-list';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { NewConversationDialog } from './new-conversation-dialog';
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
    createConversation, 
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
  const [isNewConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const [isCallDialogOpen, setCallDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Marquer la conversation comme lue à chaque sélection
  useEffect(() => {
    if (selectedConversationId) {
      markMessagesAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markMessagesAsRead]);
  
  // Afficher des informations sur l'utilisateur et l'état d'authentification
  useEffect(() => {
    console.log('ParentMessages - État de l\'utilisateur:', { 
      user, 
      isAuthenticated: !!user,
      userId: user?.id // Utiliser id car c'est la propriété dans le type User de auth-context
    });
  }, [user]);

  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (selectedConversationId) {
      console.log('Chargement des messages pour la conversation:', selectedConversationId);
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
    console.log('Conversations disponibles:', conversations);
    // Vérifier si on est sur desktop (largeur d'écran >= 768px)
    const isDesktop = window.innerWidth >= 768;
    if (conversations.length > 0 && !selectedConversationId && isDesktop) {
      console.log('Sélection automatique de la première conversation (desktop seulement):', conversations[0].id);
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Gestionnaires d'événements
  const handleSendMessage = async (content: string, attachments: any[] = []) => {
    console.log('handleSendMessage appelé avec:', { content, attachments, replyingTo });
    
    if (!selectedConversationId) {
      console.error('handleSendMessage: Aucune conversation sélectionnée');
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une conversation',
        variant: 'destructive'
      });
      return;
    }
    
    console.log('Envoi du message à la conversation:', selectedConversationId);
    const messageId = await sendMessage(selectedConversationId, content, attachments, replyingTo);
    console.log('Message envoyé, ID:', messageId);
    setReplyingTo(null);

    // Envoyer une notification au correspondant (autre participant)
    try {
      const conv = conversations.find(c => c.id === selectedConversationId);
      const receiver = conv?.participants?.find((p: any) => p.id !== user?.id);
      const receiverId = receiver?.id;

      if (receiverId) {
        const title = `Nouveau message de ${user?.name || 'Utilisateur'}`;
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
      console.error('Erreur envoi notification message:', e);
    }
  };

  const handleNewConversation = () => {
    setNewConversationDialogOpen(true);
  };

  const handleCreateConversation = async (participants: string[]) => {
    console.log('handleCreateConversation called with participants:', participants);
    console.log('User state:', user);
    
    if (!user) {
      console.error('Erreur: utilisateur non connecté');
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une conversation',
        variant: 'destructive'
      });
      setLoadingUsers(false);
      return;
    }
    
    setLoadingUsers(true);
    const conversationId = await createConversation(participants);
    console.log('Conversation créée avec ID:', conversationId);
    setLoadingUsers(false);
    setNewConversationDialogOpen(false);
    if (conversationId) {
      setSelectedConversationId(conversationId);
      console.log('Conversation sélectionnée:', conversationId);
    } else {
      console.error('Impossible de créer la conversation: conversationId est null');
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la conversation',
        variant: 'destructive'
      });
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

  const handleDownloadAttachment = (attachment: any) => {
    window.open(attachment.url, '_blank');
  };

  // Vérifier si l'utilisateur actuel est l'appelant
  const isCurrentUserCaller = currentCall ? currentCall.callerId === user?.id : false;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Layout mobile : une seule vue à la fois, desktop : grid horizontal */}
      <div className="flex flex-col md:grid md:grid-cols-3 h-full gap-4 md:gap-6">
        {/* Mobile : Liste des conversations OU zone de chat (jamais les deux) */}
        {/* Desktop : Toujours les deux côte à côte */}
        
        {/* Liste des conversations - Visible sur desktop OU sur mobile quand aucune conversation n'est sélectionnée */}
        <div className={`${selectedConversationId ? 'hidden md:block' : 'block'} h-full md:col-span-1`}>
          <Card className="h-full flex flex-col">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onNewConversation={handleNewConversation}
              currentUserId={user?.id || ''}
            />
          </Card>
        </div>

        {/* Zone de chat - Visible sur desktop OU sur mobile quand une conversation est sélectionnée */}
        <div className={`${selectedConversationId ? 'block' : 'hidden md:block'} flex-1 md:col-span-2 min-h-0`}>
          <Card className="h-full p-0 flex flex-col">
            {selectedConversationId ? (
              (() => {
                const selectedConversation = conversations.find(c => c.id === selectedConversationId);
                // Trouver le correspondant (différent de l'utilisateur connecté)
                const correspondent = selectedConversation?.participants.find((p: any) => p.id !== user?.id);
                return (
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
                      <ChatHeader
                        avatarUrl={correspondent?.avatar || ''}
                        name={correspondent?.name || ''}
                        role={correspondent?.role || ''}
                        onCallVoice={() => handleInitiateCall('audio')}
                        onCallVideo={() => handleInitiateCall('video')}
                      />
                    </div>
                    {/* Liste des messages avec scroll indépendant */}
                    <div className="flex-1 min-h-0 overflow-hidden">
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
                    {/* Input toujours en bas */}
                    <div className="flex-shrink-0 border-t bg-white dark:bg-gray-900 px-2 py-2">
                      <MessageInput
                        onSendMessage={handleSendMessage}
                        replyingTo={replyingTo}
                        onCancelReply={handleCancelReply}
                        isUploading={isUploading}
                        uploadProgress={uploadProgress}
                      />
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">Sélectionnez une conversation ou créez-en une nouvelle</p>
                  <button
                    onClick={handleNewConversation}
                    className="mt-4 flex items-center mx-auto gap-2 text-primary hover:underline text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle conversation
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Dialogues */}
      <NewConversationDialog
        open={isNewConversationDialogOpen}
        onOpenChange={setNewConversationDialogOpen}
        onCreateConversation={handleCreateConversation}
        loading={loadingUsers}
      />

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