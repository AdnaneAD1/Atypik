'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, User, Car, Mail, HeadphonesIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useRegion } from '@/hooks/use-region';

type UserType = {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
};

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (userIds: string[]) => void;
  loading: boolean;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreateConversation,
  loading
}: NewConversationDialogProps) {
  const { userRegion, loading: loadingRegion } = useRegion();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Charger les utilisateurs depuis Firestore
  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      setSearchQuery('');
      setSelectedUsers([]);
      
      // Ajouter le support Atypik par défaut
      const supportUser: UserType = {
        id: 'support',
        name: 'Support Atypik',
        role: 'Support',
        avatar: undefined
      };
      
      // Charger les chauffeurs depuis Firestore
      const fetchUsers = async () => {
        try {
          if (!userRegion?.id) return;
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef,
            where('role', '==', 'driver'),
            where('status', '==', 'verified'),
            where('regionId', '==', userRegion.id)
          );
          const snapshot = await getDocs(q);
          
          const drivers: UserType[] = [];
          snapshot.forEach((doc) => {
            const userData = doc.data();
            drivers.push({
              id: doc.id,
              name: userData.displayName || 'Utilisateur',
              email: userData.email || '',
              role: 'driver',
              avatar: userData.photoURL || undefined
            });
          });
          
          // Ajouter le support Atypik en premier, suivi des chauffeurs
          setAvailableUsers([supportUser, ...drivers]);
        } catch (error) {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          // En cas d'erreur, au moins afficher le support
          setAvailableUsers([supportUser]);
        } finally {
          setLoadingUsers(false);
        }
      };
      
      fetchUsers();
    }
  }, [open]);

  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = availableUsers.filter(user => {
    // Le support Atypik est toujours visible
    if (user.role === 'Support') return true;
    
    // Recherche par nom, email ou rôle pour les autres utilisateurs
    return searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) || 
      user.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleUserSelection = (userId: string) => {
    console.log('toggleUserSelection called with userId:', userId);
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      console.log('New selected users:', newSelection);
      return newSelection;
    });
  };

  const handleCreateConversation = () => {
    console.log('handleCreateConversation called, selectedUsers:', selectedUsers);
    if (selectedUsers.length > 0) {
      console.log('Appel de onCreateConversation avec:', selectedUsers);
      onCreateConversation(selectedUsers);
    } else {
      console.error('Aucun utilisateur sélectionné');
    }
  };

  if (loadingRegion || !userRegion) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Chargement de votre région...</span>
      </div>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher des utilisateurs</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom, email ou rôle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Sélectionner des utilisateurs</Label>
            {loadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.role === 'driver' ? (
                          <Car className="h-4 w-4" />
                        ) : user.role === 'Support' ? (
                          <HeadphonesIcon className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      {user.email && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer la conversation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
