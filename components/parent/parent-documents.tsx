'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter as FilterIcon,
  Download,
  Eye,
  Clock,
  FileIcon,
  Share2,
  Loader2,
  X
} from 'lucide-react';
import { useDocuments, Document } from '@/hooks/use-documents';
import { AddDocumentDialog } from './add-document-dialog';
import { ShareDocumentDialog } from './share-document-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Données fictives pour démonstration si aucun document n'est chargé
const mockDocuments = [
  {
    id: '1',
    name: 'Autorisation de transport',
    type: 'PDF',
    size: '1.2 MB',
    status: 'validated',
    uploadedAt: '15/02/2024',
    tags: ['Important', 'Transport'],
    url: '',
    path: '',
    userId: ''
  }
];

export function ParentDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const { 
    documents, 
    loading, 
    error, 
    searchDocuments,
    downloadDocument,
    addDocument,
    shareDocument,
    filterDocumentsByTag
  } = useDocuments();
  
  // Obtenir tous les tags uniques des documents
  const allTags = documents.reduce((tags: string[], doc) => {
    doc.tags.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []);
  
  // Filtrer les documents en fonction de la recherche et du tag actif
  const getFilteredDocuments = () => {
    let filtered = documents;
    
    // Filtrer par tag si un tag est actif
    if (activeTag) {
      filtered = filterDocumentsByTag(activeTag);
    }
    
    // Filtrer par recherche si une recherche est active
    if (searchQuery) {
      filtered = searchDocuments(searchQuery);
      
      // Si un tag est actif, on filtre u00e0 nouveau pour garder seulement les documents qui ont le tag
      if (activeTag) {
        filtered = filtered.filter(doc => doc.tags.includes(activeTag));
      }
    }
    
    return filtered;
  };
  
  const filteredDocuments = getFilteredDocuments();
  
  const handleAddDocument = (documentData: any) => {
    addDocument(documentData);
  };
  
  const handleShareDocument = (documentId: string, userIds: string[]) => {
    shareDocument(documentId, userIds);
  };
  
  const openShareDialog = (doc: Document) => {
    setSelectedDocument(doc);
    setIsShareDialogOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Documents</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Gérez vos documents importants
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Ajouter un document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <CardTitle className="text-base sm:text-lg">Liste des documents</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-9 h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-[200px]"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <FilterIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem 
                    onClick={() => setActiveTag(null)}
                    className={!activeTag ? "bg-primary/10 text-primary" : ""}
                  >
                    Tous les documents
                  </DropdownMenuItem>
                  {allTags.map(tag => (
                    <DropdownMenuItem 
                      key={tag} 
                      onClick={() => setActiveTag(tag)}
                      className={activeTag === tag ? "bg-primary/10 text-primary" : ""}
                    >
                      {tag}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Chargement des documents...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-4">
                Réessayer
              </Button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary/50 rounded-lg"
              >
                <div className="hidden sm:flex p-2.5 sm:p-3 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:block min-w-0 flex-1">
                      <div className="sm:hidden p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-medium truncate max-w-full">{doc.name}</h4>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                          <FileIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{doc.type}</span>
                          <span className="hidden xs:inline flex-shrink-0">•</span>
                          <span className="truncate">{doc.size}</span>
                          <span className="hidden xs:inline flex-shrink-0">•</span>
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{doc.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        doc.status === 'validated' ? 'default' :
                        doc.status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                      className="hidden sm:inline-flex flex-shrink-0"
                    >
                      {doc.status === 'validated' ? 'Validé' :
                       doc.status === 'pending' ? 'En attente' :
                       'Expiré'}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-3">
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {doc.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-[10px] sm:text-xs py-0 h-5 bg-primary/5 text-primary border-primary/20 truncate"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex-1 hidden sm:block" />
                    <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 sm:h-8 text-[10px] sm:text-xs flex-1 sm:flex-none px-2 sm:px-3"
                        onClick={() => openShareDialog(doc)}
                      >
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Partager</span>
                        <span className="xs:hidden">Part.</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 sm:h-8 text-[10px] sm:text-xs flex-1 sm:flex-none px-2 sm:px-3"
                        onClick={() => window.open(doc.url, '_blank')}
                        disabled={!doc.url}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Voir
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 sm:h-8 text-[10px] sm:text-xs flex-1 sm:flex-none px-2 sm:px-3"
                        onClick={() => downloadDocument(doc)}
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">Télécharger</span>
                        <span className="xs:hidden">Téléch.</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialogue d'ajout de document */}
      <AddDocumentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onDocumentAdded={handleAddDocument}
      />
      
      {/* Dialogue de partage de document */}
      <ShareDocumentDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        document={selectedDocument}
        onDocumentShared={handleShareDocument}
      />
    </div>
  );
}