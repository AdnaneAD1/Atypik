import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './use-toast';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { useUploadThing } from '@/lib/uploadthing';

// Type pour les documents
export type DocumentStatus = 'validated' | 'pending' | 'expired';

export type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  status: DocumentStatus;
  uploadedAt: string;
  tags: string[];
  url: string;
  path: string;
  userId: string;
  sharedWith?: string[];
};

// Type pour les donnu00e9es d'ajout de document
export type AddDocumentData = Omit<Document, 'id' | 'userId' | 'uploadedAt'>;

// Type pour les donnu00e9es de mise u00e0 jour de document
export type UpdateDocumentData = Partial<Omit<Document, 'id' | 'userId'>>;

// Helpers pour UploadThing sont maintenant importés depuis lib/uploadthing.ts

// Fonction pour convertir la taille en bytes en format lisible
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Fonction pour obtenir la date actuelle au format DD/MM/YYYY
const getCurrentDate = (): string => {
  const date = new Date();
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

export function useDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les documents de l'utilisateur
  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const documentsRef = collection(db, 'documents');
      const q = query(documentsRef, where('userId', '==', user.id));
      const querySnapshot = await getDocs(q);

      const loadedDocuments: Document[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Document, 'id'>;
        loadedDocuments.push({
          ...data,
          id: doc.id,
        });
      });

      setDocuments(loadedDocuments);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Impossible de charger les documents');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Ajouter un nouveau document
  const addDocument = useCallback(async (data: AddDocumentData) => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);

    try {
      const documentsRef = collection(db, 'documents');
      const newDocument = {
        ...data,
        userId: user.id,
        uploadedAt: getCurrentDate(),
      };

      const docRef = await addDoc(documentsRef, newDocument);
      
      // Ajouter le nouveau document u00e0 l'u00e9tat local
      const addedDocument: Document = {
        ...data,
        id: docRef.id,
        userId: user.id,
        uploadedAt: getCurrentDate(),
      };
      
      setDocuments((prev) => [...prev, addedDocument]);
      
      toast({
        title: 'Document ajoutu00e9',
        description: `Le document ${data.name} a u00e9tu00e9 ajoutu00e9 avec succu00e8s`,
      });
      
      return addedDocument;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du document:', err);
      setError('Impossible d\'ajouter le document');
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le document',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Mettre u00e0 jour un document existant
  const updateDocument = useCallback(async (id: string, data: UpdateDocumentData) => {
    if (!user?.id) return false;

    setLoading(true);
    setError(null);

    try {
      const documentRef = doc(db, 'documents', id);
      await updateDoc(documentRef, data);

      // Mettre u00e0 jour l'u00e9tat local
      setDocuments((prev) =>
        prev.map((document) =>
          document.id === id ? { ...document, ...data } : document
        )
      );

      toast({
        title: 'Document mis u00e0 jour',
        description: `Les informations du document ont u00e9tu00e9 mises u00e0 jour`,
      });

      return true;
    } catch (err) {
      console.error('Erreur lors de la mise u00e0 jour du document:', err);
      setError('Impossible de mettre u00e0 jour le document');
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre u00e0 jour le document',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Supprimer un document
  const deleteDocument = useCallback(async (id: string) => {
    if (!user?.id) return false;

    setLoading(true);
    setError(null);

    try {
      const documentRef = doc(db, 'documents', id);
      await deleteDoc(documentRef);

      // Mettre u00e0 jour l'u00e9tat local
      setDocuments((prev) => prev.filter((document) => document.id !== id));

      toast({
        title: 'Document supprimu00e9',
        description: 'Le document a u00e9tu00e9 supprimu00e9 avec succu00e8s',
      });

      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      setError('Impossible de supprimer le document');
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Partager un document avec d'autres utilisateurs
  const shareDocument = useCallback(async (id: string, userIds: string[]) => {
    if (!user?.id) return false;

    setLoading(true);
    setError(null);

    try {
      const documentRef = doc(db, 'documents', id);
      await updateDoc(documentRef, {
        sharedWith: userIds,
      });

      // Mettre u00e0 jour l'u00e9tat local
      setDocuments((prev) =>
        prev.map((document) =>
          document.id === id ? { ...document, sharedWith: userIds } : document
        )
      );

      toast({
        title: 'Document partagu00e9',
        description: `Le document a u00e9tu00e9 partagu00e9 avec ${userIds.length} utilisateur(s)`,
      });

      return true;
    } catch (err) {
      console.error('Erreur lors du partage du document:', err);
      setError('Impossible de partager le document');
      toast({
        title: 'Erreur',
        description: 'Impossible de partager le document',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Tu00e9lu00e9charger un document
  const downloadDocument = useCallback(async (doc: Document) => {
    try {
      // Pour le téléchargement, nous utilisons simplement l'URL du document
      // Dans un environnement de production, cela pourrait être une URL signée ou un appel API
      if (!doc.url) {
        throw new Error('URL du document non disponible');
      }

      // Créer un lien temporaire pour le téléchargement
      const link = window.document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast({
        title: 'Téléchargement démarré',
        description: `Le document ${doc.name} est en cours de téléchargement`,
      });

      return true;
    } catch (err) {
      console.error('Erreur lors du téléchargement du document:', err);
      setError('Impossible de télécharger le document');
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Filtrer les documents par tag
  const filterDocumentsByTag = useCallback((tag: string) => {
    return documents.filter((document) => document.tags.includes(tag));
  }, [documents]);

  // Rechercher des documents par nom
  const searchDocuments = useCallback((query: string) => {
    if (!query.trim()) return documents;
    
    const lowerCaseQuery = query.toLowerCase();
    return documents.filter((document) => 
      document.name.toLowerCase().includes(lowerCaseQuery) ||
      document.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
    );
  }, [documents]);

  // Charger les documents au montage du composant
  useEffect(() => {
    if (user?.id) {
      loadDocuments();
    }
  }, [user?.id, loadDocuments]);

  return {
    documents,
    loading,
    error,
    loadDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    shareDocument,
    downloadDocument,
    filterDocumentsByTag,
    searchDocuments,
    formatFileSize,
  };
}
