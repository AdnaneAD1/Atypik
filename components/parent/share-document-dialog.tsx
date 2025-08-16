'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Share2, MessageCircle, Link, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/lib/auth/auth-context';
import { Document } from '@/hooks/use-documents';

// Types pour les méthodes de partage
type ShareMethod = 'message' | 'link';

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onDocumentShared: (documentId: string, userIds: string[]) => void;
}

export function ShareDocumentDialog({ 
  open, 
  onOpenChange, 
  document, 
  onDocumentShared 
}: ShareDocumentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMethod, setShareMethod] = useState<ShareMethod>('message');
  const [linkCopied, setLinkCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { conversations, sendMessage, shareDocument, createConversation } = useMessages();

  // Charger les utilisateurs disponibles depuis les conversations
  const loadAvailableUsers = React.useCallback(() => {
    const users: User[] = [];
    const userIds = new Set<string>();
    const currentUserId = user?.id; // ID de l'utilisateur connecté

    // Extraire les utilisateurs des conversations existantes
    conversations.forEach(conversation => {
      conversation.participants.forEach(participant => {
        // Exclure l'utilisateur connecté et éviter les doublons
        if (!userIds.has(participant.id) && participant.id !== currentUserId) {
          userIds.add(participant.id);
          users.push({
            id: participant.id,
            name: participant.name || 'Utilisateur',
            avatar: participant.avatar,
            isOnline: participant.online || false
          });
        }
      });
    });

    setAvailableUsers(users);
  }, [conversations, user?.id]);

  // Réinitialiser les états à l'ouverture du dialogue
  useEffect(() => {
    if (open) {
      setSelectedUsers([]);
      setSearchQuery('');
      setCustomMessage('');
      setShareMethod('message');
      setLinkCopied(false);
      loadAvailableUsers();
    }
  }, [open, loadAvailableUsers]);

  // Fonction pour copier le lien dans le presse-papier
  const copyLinkToClipboard = async () => {
    if (!document) return;

    try {
      await navigator.clipboard.writeText(document.url);
      setLinkCopied(true);
      toast({
        title: 'Lien copié',
        description: 'Le lien du document a été copié dans le presse-papier',
      });
      
      // Réinitialiser l'état après 3 secondes
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour partager via l'API native du navigateur
  const shareViaWebAPI = async () => {
    if (!document) return;

    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Document: ${document.name}`,
          text: `Consultez ce document: ${document.name}`,
          url: document.url
        });
        
        toast({
          title: 'Document partagé',
          description: 'Le document a été partagé avec succès',
        });
      } catch (error) {
        // L'utilisateur a annulé le partage ou erreur
        if ((error as Error).name !== 'AbortError') {
          console.error('Erreur lors du partage:', error);
          toast({
            title: 'Erreur',
            description: 'Impossible de partager le document',
            variant: 'destructive',
          });
        }
      }
    } else {
      // Fallback: copier le lien si l'API n'est pas disponible
      await copyLinkToClipboard();
    }
  };



  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = searchQuery
    ? availableUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) 
      )
    : availableUsers;

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (!document || selectedUsers.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un utilisateur',
        variant: 'destructive',
      });
      return;
    }

    setIsSharing(true);

    try {
      if (shareMethod === 'message') {
        await shareViaMessage();
      } else {
        // Méthode de partage classique
        onDocumentShared(document.id, selectedUsers);
      }
      
      toast({
        title: 'Document partagé',
        description: `Le document a été partagé avec ${selectedUsers.length} utilisateur(s)`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du partage du document',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };



  const shareViaMessage = async () => {
    if (!document) return;

    const messageText = customMessage || `📄 Document partagé : ${document.name}`;
    
    for (const userId of selectedUsers) {
      try {
        // Trouver ou créer une conversation avec cet utilisateur
        let conversation = conversations.find(conv => 
          conv.participants.some(p => p.id === userId) && conv.participants.length === 2
        );

        if (!conversation) {
          const conversationId = await createConversation([userId]);
          if (conversationId) {
            // Trouver la conversation créée
            conversation = conversations.find(conv => conv.id === conversationId);
          }
        }

        if (conversation) {
          // Utiliser la fonction shareDocument optimisée qui utilise directement les infos du document
          await shareDocument(
            conversation.id,
            {
              id: document.id,
              name: document.name,
              type: document.type,
              size: document.size,
              url: document.url
            },
            messageText
          );

          // Envoyer une notification au correspondant (autre participant)
          try {
            const currentUserId = user?.id;
            const receiver = conversation.participants?.find((p: any) => p.id !== currentUserId);
            const receiverId = receiver?.id || userId; // fallback sur l'utilisateur ciblé dans la boucle
            if (receiverId) {
              const title = `Nouveau document de ${user?.name || 'Utilisateur'}`;
              const body = (messageText || `📄 ${document.name}`).slice(0, 140);
              await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: receiverId,
                  title,
                  body,
                  data: {
                    type: 'message',
                    subtype: 'document',
                    conversationId: conversation.id,
                    documentId: document.id,
                  },
                }),
              });
            }
          } catch (e) {
            console.error('Erreur envoi notification document:', e);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi à l'utilisateur ${userId}:`, error);
        toast({
          title: 'Erreur',
          description: `Impossible de partager avec cet utilisateur`,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager le document
          </DialogTitle>
          {document && (
            <p className="text-sm text-muted-foreground">
              {document.name} • {document.type}
            </p>
          )}
        </DialogHeader>
        
        {document && (
          <div className="py-4">
            {/* Informations du document */}
            <div className="p-3 bg-secondary/50 rounded-lg mb-4">
              <p className="font-medium">{document.name}</p>
              <p className="text-sm text-muted-foreground">{document.type} • {document.size}</p>
            </div>

            {/* Onglets pour les méthodes de partage */}
            <Tabs value={shareMethod} onValueChange={(value) => setShareMethod(value as ShareMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="message" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Messagerie</span>
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  <span className="hidden sm:inline">Lien</span>
                </TabsTrigger>
              </TabsList>

              {/* Contenu de l'onglet Messagerie */}
              <TabsContent value="message" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Message personnalisé (optionnel)</Label>
                  <Textarea
                    id="message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Ajouter un message avec le document..."
                    rows={3}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="search">Rechercher des contacts</Label>
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nom ou email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Contacts disponibles</Label>
                  <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">Aucun contact trouvé</p>
                    ) : (
                      filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 hover:bg-secondary/30">
                          <Checkbox 
                            id={`user-${user.id}`} 
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                          <div className="flex items-center space-x-2 flex-1">
                            <div className={`w-2 h-2 rounded-full ${
                              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium">{user.name}</div>
                            </Label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Contenu de l'onglet Lien */}
              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="text-center py-6">
                  <Link className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="font-medium mb-2">Partager via un lien</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Copiez le lien direct du document pour le partager
                  </p>
                  
                  {/* Affichage du lien */}
                  <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-mono break-all text-muted-foreground">
                      {document?.url || 'Aucun lien disponible'}
                    </p>
                  </div>
                  
                  {/* Bouton de partage */}
                  <Button 
                    onClick={shareViaWebAPI}
                    disabled={!document?.url}
                    className="w-full sm:w-auto"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                  
                  <div className="text-xs text-muted-foreground mt-4">
                    <p>Cliquez sur <strong>Partager</strong> pour ouvrir le menu natif de votre appareil et choisir l&apos;application (WhatsApp, SMS, Email, etc.)</p>
                  </div>
                </div>
              </TabsContent>


            </Tabs>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {selectedUsers.length > 0 && (
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedUsers.length} utilisateur(s) sélectionné(s)
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSharing}>
              Annuler
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={isSharing || (shareMethod === 'message' && selectedUsers.length === 0)}
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {shareMethod === 'message' ? 'Envoi...' : 'Partage...'}
                </>
              ) : (
                <>
                  {shareMethod === 'message' ? (
                    <><MessageCircle className="mr-2 h-4 w-4" />Envoyer</>
                  ) : (
                    <><ExternalLink className="mr-2 h-4 w-4" />Fermer</>
                  )}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
