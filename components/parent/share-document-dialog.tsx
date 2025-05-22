'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/hooks/use-documents';

// Données fictives d'utilisateurs pour la démonstration
const mockUsers = [
  { id: 'user1', name: 'Marie Dupont', email: 'marie.dupont@example.com' },
  { id: 'user2', name: 'Thomas Martin', email: 'thomas.martin@example.com' },
  { id: 'user3', name: 'Sophie Bernard', email: 'sophie.bernard@example.com' },
  { id: 'user4', name: 'Lucas Petit', email: 'lucas.petit@example.com' },
];

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
  
  const { toast } = useToast();

  // Réinitialiser les utilisateurs sélectionnés à l'ouverture du dialogue
  useEffect(() => {
    if (open) {
      setSelectedUsers([]);
      setSearchQuery('');
    }
  }, [open]);

  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = searchQuery
    ? mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockUsers;

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
      // Appeler la fonction de partage
      onDocumentShared(document.id, selectedUsers);
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Partager le document</DialogTitle>
        </DialogHeader>
        
        {document && (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="font-medium">{document.name}</p>
              <p className="text-sm text-muted-foreground">{document.type} • {document.size}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher des utilisateurs</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom ou email"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Utilisateurs</Label>
              <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
                ) : (
                  filteredUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-2 p-3">
                      <Checkbox 
                        id={`user-${user.id}`} 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                        <div>{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSharing}>
            Annuler
          </Button>
          <Button onClick={handleShare} disabled={isSharing || selectedUsers.length === 0}>
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Partage en cours...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Partager
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
