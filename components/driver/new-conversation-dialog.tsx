"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, User, Mail, HeadphonesIcon, Car } from "lucide-react";
import { Loader2 } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/ClientApp";
import { useRegion } from "@/hooks/use-region";

// Le type ParentUserType est adapté pour les parents
export type ParentUserType = {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
};

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (parentIds: string[]) => void;
  loading: boolean;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreateConversation,
  loading
}: NewConversationDialogProps) {
  const { userRegion, loading: loadingRegion } = useRegion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [availableParents, setAvailableParents] = useState<ParentUserType[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Charger les parents de la même région que le chauffeur
  useEffect(() => {
    if (open) {
      setLoadingParents(true);
      setSearchQuery("");
      setSelectedParents([]);
      const fetchParents = async () => {
        try {
          if (!userRegion?.id) return;
          const usersRef = collection(db, "users");
          const q = query(
            usersRef,
            where("role", "==", "parent"),
            where("regionId", "==", userRegion.id)
          );
          const snapshot = await getDocs(q);
          const parents: ParentUserType[] = [];
          snapshot.forEach((doc) => {
            const userData = doc.data();
            parents.push({
              id: doc.id,
              name: userData.displayName || "Parent",
              email: userData.email || "",
              role: "parent",
              avatar: userData.photoURL || undefined
            });
          });
          setAvailableParents(parents);
        } catch (error) {
          console.error("Erreur lors du chargement des parents:", error);
          setAvailableParents([]);
        } finally {
          setLoadingParents(false);
        }
      };
      fetchParents();
    }
  }, [open, userRegion]);

  // Filtrer les parents selon la recherche
  const filteredParents = availableParents.filter((parent) => {
    return (
      searchQuery === "" ||
      parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (parent.email && parent.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const toggleParentSelection = (parentId: string) => {
    setSelectedParents((prev) =>
      prev.includes(parentId)
        ? prev.filter((id) => id !== parentId)
        : [...prev, parentId]
    );
  };

  const handleCreateConversation = () => {
    if (selectedParents.length > 0) {
      onCreateConversation(selectedParents);
    } else {
      console.error("Aucun parent sélectionné");
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
            <Label htmlFor="search">Rechercher un parent</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sélectionner un ou plusieurs parents</Label>
            {loadingParents ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Aucun parent trouvé
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredParents.map((parent) => (
                  <div
                    key={parent.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedParents.includes(parent.id)}
                      onCheckedChange={() => toggleParentSelection(parent.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={parent.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{parent.name}</p>
                      {parent.email && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate">{parent.email}</span>
                        </div>
                      )}
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
            disabled={selectedParents.length === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer la conversation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
