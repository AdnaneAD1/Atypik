'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';
import { useFileUpload } from './use-file-upload';
import { User as FirebaseUser } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';

// Type étendu pour l'utilisateur Firebase
// Nouveau type User harmonisé avec le modèle de l'app
export type User = {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
};
// Types pour les messages
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessageAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
};

// Les types pour les appels audio/vidu00e9o ont u00e9tu00e9 du00e9placu00e9s vers hooks/use-call.ts

// Types pour les conversations
export type Participant = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  online?: boolean;
};

export type Conversation = {
  id: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageSender?: string;  // ID de l'expu00e9diteur du dernier message
  lastMessageTime: any;
  unreadCount: { [userId: string]: number };
  createdAt: any;
};

// Hook principal pour la gestion des messages
export function useMessages() {
  const { user, isAuthenticated } = useAuth();
  // user: { id, name, email, role, avatar }
  
  // Débogage de l'état de l'utilisateur
  console.log('useMessages - État de l\'authentification:', { 
    isAuthenticated, 
    user,
    userId: user?.id
  });
  
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useFileUpload();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Référence pour éviter les boucles infinies avec loadConversations
  const loadConversationsRef = useRef<any>(null);

  // Charger les conversations de l'utilisateur
  const loadConversations = useCallback(async () => {
    console.log('loadConversations appelé, user:', user);
    
    const userId = user?.id;
    
    if (!userId) {
      console.error('loadConversations: utilisateur non connecté ou ID manquant');
      return;
    }
    
    console.log('loadConversations: utilisateur connecté avec ID:', userId);

    setLoading(true);
    setError(null);

    try {
      // Créer une référence à la collection des conversations
      const conversationsRef = collection(db, 'conversations');
      
      // Créer une requête pour récupérer les conversations où l'utilisateur est participant
      const q = query(
        conversationsRef,
        where('participantIds', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );

      // Écouter les changements en temps réel
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const conversationsData: Conversation[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          // Récupérer les informations des participants
          const participantsData: Participant[] = [];
          
          for (const participantId of data.participantIds) {
            if (participantId === userId && user) {
              // Ajouter l'utilisateur actuel avec ses vraies infos
              participantsData.push({
                id: userId,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                online: true
              });
            } else {
              // Récupérer les informations des autres participants de façon simplifiée
              try {
                // Utiliser une approche plus simple pour éviter les collisions de noms
                const userRef = collection(db, 'users');
                const userQuery = query(userRef, where('__name__', '==', participantId));
                const userSnapshot = await getDocs(userQuery);
                
                if (!userSnapshot.empty) {
                  const userData = userSnapshot.docs[0].data();
                  participantsData.push({
                    id: participantId,
                    name: userData.displayName || userData.name || 'Utilisateur',
                    role: userData.role || 'Utilisateur',
                    avatar: userData.photoURL || userData.avatar || undefined,
                    online: userData.online || false
                  });
                } else {
                  // Ajouter un participant par défaut si le document n'existe pas
                  participantsData.push({
                    id: participantId,
                    name: 'Utilisateur',
                    role: 'Utilisateur',
                    avatar: undefined,
                    online: false
                  });
                }
              } catch (error) {
                console.error('Erreur lors de la récupération du participant:', error);
              }
            }
          }
          
          conversationsData.push({
            id: docSnapshot.id,
            participants: participantsData,
            lastMessage: data.lastMessage || '',
            lastMessageSender: data.lastMessageSender || '',
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            unreadCount: data.unreadCount || {}, // la clé doit être user.id
            createdAt: data.createdAt?.toDate() || new Date()
          });
        }
        
        setConversations(conversationsData);
        setLoading(false);
      }, (error) => {
        console.error('Erreur lors de la récupération des conversations:', error);
        setError('Erreur lors du chargement des conversations');
        setLoading(false);
      });

      // Retourner la fonction de nettoyage
      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      setError('Erreur lors du chargement des conversations');
      setLoading(false);
      
      // Retourner une fonction de nettoyage vide en cas d'erreur
      return () => {};
    }
  }, [user]);

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user || !conversationId) return;

    setLoading(true);
    setError(null);
    setCurrentConversation(conversationId);

    try {
      // Créer une référence à la collection des messages
      const messagesRef = collection(db, 'messages');
      
      // Créer une requête pour récupérer les messages de la conversation
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      // Écouter les changements en temps réel
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData: Message[] = [];
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            conversationId: data.conversationId,
            senderId: data.senderId,
            senderName: data.senderName || 'Utilisateur',
            content: data.content || '',
            timestamp: data.timestamp?.toDate() || new Date(),
            status: data.status || 'sent',
            attachments: data.attachments || [],
            replyTo: data.replyTo || undefined
          });
        });
        
        setMessages(messagesData);
        
        // Marquer les messages comme lus
        if (messagesData.length > 0) {
          markMessagesAsRead(conversationId);
        }
        
        setLoading(false);
      }, (error) => {
        console.error('Erreur lors de la récupération des messages:', error);
        setError('Erreur lors du chargement des messages');
        setLoading(false);
      });

      // Retourner la fonction de nettoyage
      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setError('Erreur lors du chargement des messages');
      setLoading(false);
    }
  }, [user]);

  // Marquer les messages comme lus
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    // Récupérer l'ID de l'utilisateur (peut être uid pour FirebaseUser ou id pour notre type User)
    const userId = user?.id;
    
    if (!userId || !conversationId) {
      console.error('markMessagesAsRead: utilisateur non connecté ou ID de conversation manquant');
      return;
    }

    try {
      // Mettre à jour le compteur de messages non lus
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0
      });

      // Mettre à jour le statut des messages
      // Firestore ne permet pas d'utiliser plus d'un filtre d'inégalité ('!=')
      // dans une même requête, donc nous allons filtrer sur un seul champ et filtrer les autres en mémoire
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('status', '!=', 'read')
      );

      const snapshot = await getDocs(q);
      snapshot.docs.forEach(async (doc) => {
        const data = doc.data();
        // Ne mettre à jour que les messages qui ne sont pas envoyés par l'utilisateur actuel
        if (data.senderId !== userId) {
          await updateDoc(doc.ref, { status: 'read' });
        }
      });
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  }, [user]);

  // Envoyer un message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    attachments: File[] = [],
    replyToMessage?: Message
  ) => {
    console.log('sendMessage appelé avec:', { conversationId, content, attachments, replyToMessage });
    
    // Récupérer l'ID de l'utilisateur (peut être uid pour FirebaseUser ou id pour notre type User)
    const userId = user?.id;
    
    if (!user) {
      console.error('sendMessage: utilisateur non connecté');
      return null;
    }
    
    if (!userId) {
      console.error('sendMessage: ID utilisateur manquant', user);
      return null;
    }
    
    if (!conversationId) {
      console.error('sendMessage: ID de conversation manquant');
      return null;
    }
    
    if (!content.trim() && attachments.length === 0) {
      console.error('sendMessage: contenu vide et pas de pièces jointes');
      return null;
    }
    
    console.log('sendMessage: toutes les vérifications passées, envoi du message avec userId:', userId);

    try {
      // Uploader les pièces jointes si présentes
      const uploadedAttachments: MessageAttachment[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const uploadResponse = await uploadFile(file);
          
          if (uploadResponse && uploadResponse.success) {
            uploadedAttachments.push({
              id: uploadResponse.file.id,
              name: uploadResponse.file.name,
              type: uploadResponse.file.type,
              size: uploadResponse.file.size,
              url: uploadResponse.file.url
            });
          }
        }
      }

      // Créer le message
      const messageData: any = {
        conversationId,
        senderId: userId,
        senderName: user?.name || '',
        content: content.trim(),
        timestamp: serverTimestamp(),
        status: 'sent',
        attachments: uploadedAttachments
      };

      // Ajouter la référence au message si on répond à un message
      if (replyToMessage) {
        messageData.replyTo = {
          id: replyToMessage.id,
          content: replyToMessage.content,
          senderId: replyToMessage.senderId
        };
      }

      // Ajouter le message à la collection
      const messagesRef = collection(db, 'messages');
      const messageRef = await addDoc(messagesRef, messageData);

      // Mettre à jour la conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data();
        const participantIds = conversationData.participantIds || [];
        
        // Mettre à jour les compteurs de messages non lus pour tous les participants sauf l'expéditeur
        const unreadCount = conversationData.unreadCount || {};
        
        for (const participantId of participantIds) {
          if (participantId !== userId) {
            unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
          }
        }

        // Mettre à jour la conversation
        const senderName = userId === (user as any)?.id ? 'Vous' : user?.name || 'Vous';
        const lastMessageText = content.trim() || 'Pièce jointe';
        
        await updateDoc(conversationRef, {
          lastMessage: lastMessageText,
          lastMessageSender: userId,  
          lastMessageTime: serverTimestamp(),
          unreadCount
        });
      }

      return messageRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi du message',
        variant: 'destructive'
      });
      return null;
    }
  }, [user, uploadFile, toast]);

  // Créer une nouvelle conversation
  const createConversation = useCallback(async (participants: string[]) => {
    console.log('createConversation called with participants:', participants);
    
    // Vérifier que l'utilisateur est connecté
    // L'utilisateur peut avoir soit uid (Firebase) soit id (notre structure personnalisée)
    const userId = user?.id;
    
    if (!userId) {
      console.error('createConversation: user ID is undefined', user);
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une conversation',
        variant: 'destructive'
      });
      return null;
    }
    
    // Afficher les informations de l'utilisateur pour le débogage
    console.log('User info in createConversation:', {
      userId,
      userObject: user
    });

    try {
      // S'assurer que l'utilisateur actuel est inclus dans les participants et qu'il n'y a pas de doublons
      const uniqueParticipantIds = Array.from(new Set([userId, ...participants])).sort();
      console.log('uniqueParticipantIds:', uniqueParticipantIds);
      
      // Vérifier si une conversation existe déjà avec ces participants
      // Firestore ne peut pas comparer des tableaux entiers avec '==', donc nous devons vérifier différemment
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('participantIds', 'array-contains', userId));
      const snapshot = await getDocs(q);
      
      console.log('Conversations existantes pour cet utilisateur:', snapshot.docs.length);
      
      // Vérifier manuellement si l'une des conversations a exactement les mêmes participants
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const participantIds = data.participantIds || [];
        
        console.log('Comparaison des participants:', {
          existants: participantIds,
          nouveaux: uniqueParticipantIds,
          tailleIdentique: participantIds.length === uniqueParticipantIds.length,
          existantsTriés: [...participantIds].sort(),
          nouveauxTriés: uniqueParticipantIds
        });
        
        // Vérifier si les deux tableaux ont la même taille et les mêmes éléments (après tri)
        if (participantIds.length === uniqueParticipantIds.length && 
            JSON.stringify([...participantIds].sort()) === JSON.stringify(uniqueParticipantIds)) {
          console.log('Conversation existante trouvée avec ID:', doc.id);
          // Retourner la conversation existante
          return doc.id;
        }
      }

      // Créer une nouvelle conversation
      console.log('Création d\'une nouvelle conversation avec participants:', uniqueParticipantIds);
      const conversationData = {
        participantIds: uniqueParticipantIds,
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: {},
        createdAt: serverTimestamp()
      };

      const conversationRef = await addDoc(conversationsRef, conversationData);
      console.log('Nouvelle conversation créée avec ID:', conversationRef.id);
      return conversationRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création de la conversation',
        variant: 'destructive'
      });
      return null;
    }
  }, [user, toast]);

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user || !user.id) return false;

    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        
        // Vérifier que l'utilisateur est l'expéditeur du message
        if (messageData.senderId === user.id) {
          await deleteDoc(messageRef);
          
          // Mettre à jour la conversation si nécessaire
          const conversationId = messageData.conversationId;
          const conversationRef = doc(db, 'conversations', conversationId);
          const conversationDoc = await getDoc(conversationRef);
          
          if (conversationDoc.exists()) {
            const conversationData = conversationDoc.data();
            
            // Si le dernier message de la conversation est celui qu'on supprime,
            // mettre à jour avec le message précédent
            if (conversationData.lastMessage === messageData.content) {
              // Récupérer le message précédent
              const messagesRef = collection(db, 'messages');
              const q = query(
                messagesRef,
                where('conversationId', '==', conversationId),
                orderBy('timestamp', 'desc'),
                where('id', '!=', messageId)
              );
              
              const snapshot = await getDocs(q);
              
              if (!snapshot.empty) {
                const lastMessage = snapshot.docs[0].data();
                await updateDoc(conversationRef, {
                  lastMessage: lastMessage.content || 'Pièce jointe',
                  lastMessageTime: lastMessage.timestamp
                });
              } else {
                // Pas d'autres messages, réinitialiser
                await updateDoc(conversationRef, {
                  lastMessage: '',
                  lastMessageTime: conversationData.createdAt
                });
              }
            }
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression du message',
        variant: 'destructive'
      });
      return false;
    }
  }, [user, toast]);

  // Supprimer une conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user || !user.id) return false;

    try {
      // Supprimer tous les messages de la conversation
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('conversationId', '==', conversationId));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Supprimer la conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      batch.delete(conversationRef);
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression de la conversation',
        variant: 'destructive'
      });
      return false;
    }
  }, [user, toast]);

  // Mettre u00e0 jour la ru00e9fu00e9rence de loadConversations
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  // Charger les conversations au chargement du hook
  useEffect(() => {
    if (user) {
      // Appeler la fonction loadConversations et stocker la fonction de nettoyage
      const unsubscribeFunc = loadConversationsRef.current();
      
      // Retourner une fonction de nettoyage qui vu00e9rifie si unsubscribeFunc est une fonction
      return () => {
        if (unsubscribeFunc && typeof unsubscribeFunc === 'function') {
          unsubscribeFunc();
        }
      };
    }
  }, [user]);

  return {
    conversations,
    messages,
    currentConversation,
    loading,
    error,
    isUploading,
    uploadProgress: progress,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    deleteMessage,
    deleteConversation,
    markMessagesAsRead
  };
}
