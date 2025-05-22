import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';

export interface Child {
  id?: string;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  school: string;
  avatar: string | null;
  needs: string[];
  parentId: string;
}

export interface AddChildData {
  firstName: string;
  lastName: string;
  age: string;
  school: string;
  specialNeeds?: string;
}

export function useChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger les enfants de l'utilisateur actuel avec useCallback pour éviter les dépendances circulaires
  const loadChildren = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const childrenQuery = query(
        collection(db, 'children'),
        where('parentId', '==', user.id)
      );
      
      const querySnapshot = await getDocs(childrenQuery);
      const childrenData: Child[] = [];
      
      querySnapshot.forEach((doc) => {
        childrenData.push({
          id: doc.id,
          ...doc.data() as Omit<Child, 'id'>
        });
      });
      
      setChildren(childrenData);
    } catch (err) {
      console.error('Erreur lors du chargement des enfants:', err);
      setError('Impossible de charger les enfants');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les enfants',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Ajouter un nouvel enfant
  const addChild = async (data: AddChildData): Promise<Child | null> => {
    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour ajouter un enfant',
        variant: 'destructive',
      });
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newChild: Omit<Child, 'id'> = {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        age: parseInt(data.age),
        school: data.school,
        avatar: null,
        needs: data.specialNeeds ? data.specialNeeds.split(',').map((need: string) => need.trim()) : [],
        parentId: user.id
      };
      
      const docRef = await addDoc(collection(db, 'children'), newChild);
      
      const childWithId: Child = {
        id: docRef.id,
        ...newChild
      };
      
      setChildren(prev => [...prev, childWithId]);
      
      toast({
        title: 'Enfant ajouté',
        description: `${childWithId.name} a été ajouté avec succès`,
      });
      
      return childWithId;
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'enfant:', err);
      setError('Impossible d\'ajouter l\'enfant');
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'enfant',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour un enfant existant
  const updateChild = async (id: string, data: Partial<Child>): Promise<boolean> => {
    if (!user?.id) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const childRef = doc(db, 'children', id);
      await updateDoc(childRef, data);
      
      setChildren(prev => 
        prev.map(child => 
          child.id === id ? { ...child, ...data } : child
        )
      );
      
      toast({
        title: 'Enfant mis à jour',
        description: 'Les informations ont été mises à jour avec succès',
      });
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'enfant:', err);
      setError('Impossible de mettre à jour l\'enfant');
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'enfant',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un enfant
  const deleteChild = async (id: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const childRef = doc(db, 'children', id);
      await deleteDoc(childRef);
      
      setChildren(prev => prev.filter(child => child.id !== id));
      
      toast({
        title: 'Enfant supprimé',
        description: 'L\'enfant a été supprimé avec succès',
      });
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'enfant:', err);
      setError('Impossible de supprimer l\'enfant');
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'enfant',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les enfants lorsque l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      loadChildren();
    } else {
      setChildren([]);
    }
  }, [user?.id, loadChildren]);

  return {
    children,
    isLoading,
    error,
    loadChildren,
    addChild,
    updateChild,
    deleteChild
  };
}
