'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  Share2,
} from 'lucide-react';
import { CarLoader } from '@/components/ui/loader';
import { useDocuments, Document } from '@/hooks/use-documents';
import { AddDocumentDialog } from './add-document-dialog';
import { ShareDocumentDialog } from './share-document-dialog';
import { DocumentViewer } from '@/components/ui/document-viewer';
import { DriverMediaViewer } from '@/components/driver/driver-media-viewer';
import { getFileKind } from '@/lib/files/file-kind';
import { cn } from '@/lib/utils';

function docTypeLabel(type?: string) {
  const t = (type || 'PDF').toUpperCase();
  return t.length > 5 ? 'FICHIER' : t;
}

// Même template pour l'en-tête et les lignes : colonnes parfaitement alignées
const DOCS_GRID_COLS =
  'sm:grid-cols-[64px_minmax(0,1fr)_140px_150px] md:grid-cols-[64px_minmax(0,1fr)_140px_360px]';

export function ParentDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    documents,
    loading,
    error,
    loadDocuments,
    searchDocuments,
    downloadDocument,
    addDocument,
    shareDocument,
    filterDocumentsByTag,
  } = useDocuments();

  // Obtenir tous les tags uniques des documents
  const allTags = documents.reduce((tags: string[], doc) => {
    doc.tags.forEach((tag) => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []);

  // Filtrer les documents en fonction de la recherche et du tag actif
  const getFilteredDocuments = () => {
    let filtered = documents;

    if (activeTag) {
      filtered = filterDocumentsByTag(activeTag);
    }

    if (searchQuery) {
      filtered = searchDocuments(searchQuery);
      if (activeTag) {
        filtered = filtered.filter((doc) => doc.tags.includes(activeTag));
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

  // Aperçu dans l'app : PDF → visionneuse pdf.js, image/vidéo → visionneuse
  // média. Les formats non visualisables (docx, zip…) sont téléchargés.
  const openPreview = (doc: Document) => {
    if (!doc.url) return;
    if (getFileKind(doc) === 'other') {
      void downloadDocument(doc);
      return;
    }
    setPreviewDoc(doc);
  };

  const previewKind = previewDoc ? getFileKind(previewDoc) : 'other';
  const previewAttachment = previewDoc
    ? { id: previewDoc.id, name: previewDoc.name, url: previewDoc.url, type: previewDoc.type, size: 0 }
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-2 sm:px-4 md:px-6">
      {/* En-tête */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos documents importants
          </p>
        </div>
        <Button
          className="h-10 shrink-0 bg-primary hover:bg-primary/90 sm:h-12 sm:px-5"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un document</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Outils : chips de filtre + recherche soulignée */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par tag">
          <button
            aria-pressed={activeTag === null}
            onClick={() => setActiveTag(null)}
            className={cn(
              'min-h-[44px] rounded-full px-5 text-sm transition-colors',
              activeTag === null
                ? 'bg-primary font-bold text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            Tous
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                'min-h-[44px] rounded-full px-5 text-sm transition-colors',
                activeTag === tag
                  ? 'bg-primary font-bold text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un document"
            aria-label="Rechercher un document"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full border-b-2 border-slate-900 bg-transparent pl-7 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CarLoader size={160} />
          <span className="ml-2 text-sm text-muted-foreground">Chargement des documents...</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={loadDocuments}>
            Réessayer
          </Button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-10 text-center sm:flex-row sm:text-left">
          <div className="h-28 w-[102px] shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="" className="h-full w-full object-cover object-left" />
          </div>
          <div>
            <p className="text-sm font-medium">Aucun document trouvé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || activeTag
                ? 'Aucun document ne correspond à votre recherche.'
                : 'Ajoutez votre premier document'}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* En-têtes de colonnes — desktop */}
          <div
            className={cn(
              'hidden items-center gap-6 border-b-2 border-slate-900 pb-2.5 text-sm text-muted-foreground sm:grid',
              DOCS_GRID_COLS
            )}
          >
            <span />
            <span>Document</span>
            <span>Ajouté le</span>
            <span className="text-right">Actions</span>
          </div>

          <ul className="divide-y divide-slate-200">
            {filteredDocuments.map((doc) => (
              <li
                key={doc.id}
                className={cn(
                  'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-2 py-5 transition-colors hover:bg-slate-50 sm:items-center sm:gap-x-6 sm:gap-y-0',
                  DOCS_GRID_COLS
                )}
              >
                {/* Mini-feuille document */}
                <div
                  aria-hidden="true"
                  className="row-span-3 flex h-16 w-12 shrink-0 flex-col justify-between overflow-hidden rounded-md border border-slate-300 bg-white sm:col-start-1 sm:row-span-1"
                >
                  <div className="space-y-1 px-1.5 pt-2">
                    <div className="h-[3px] w-4/5 rounded-full bg-slate-200" />
                    <div className="h-[3px] w-3/5 rounded-full bg-slate-200" />
                    <div className="h-[3px] w-4/5 rounded-full bg-slate-200" />
                  </div>
                  <span className="bg-brand-yellow py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-slate-900">
                    {docTypeLabel(doc.type)}
                  </span>
                </div>

                {/* Titre + méta + tags */}
                <div className="min-w-0 sm:col-start-2">
                  <h2 className="truncate font-brand text-lg font-bold leading-tight text-slate-900">
                    <button
                      type="button"
                      onClick={() => openPreview(doc)}
                      disabled={!doc.url}
                      title={doc.url ? `Aperçu de ${doc.name}` : undefined}
                      className="max-w-full truncate text-left transition-colors hover:text-brand-coral disabled:opacity-60"
                    >
                      {doc.name}
                    </button>
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:text-sm">
                    <span>{doc.type}</span>
                    <span>{doc.size}</span>
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {doc.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date */}
                <p className="col-start-2 text-sm text-muted-foreground sm:col-start-3">
                  {doc.uploadedAt}
                </p>

                {/* Actions — icônes conservées */}
                <div className="col-start-2 -ml-2.5 flex items-center gap-1 sm:col-start-4 sm:ml-0 sm:justify-end">
                  <button
                    className="flex min-h-[44px] items-center gap-1.5 px-2.5 text-sm font-bold text-slate-900 underline decoration-2 underline-offset-4 hover:decoration-brand-yellow"
                    onClick={() => openShareDialog(doc)}
                    aria-label={`Partager ${doc.name}`}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden md:inline">Partager</span>
                  </button>
                  <button
                    className="flex min-h-[44px] items-center gap-1.5 px-2.5 text-sm font-bold text-slate-900 underline decoration-2 underline-offset-4 hover:decoration-brand-yellow disabled:text-muted-foreground"
                    onClick={() => openPreview(doc)}
                    disabled={!doc.url}
                    aria-label={`Voir ${doc.name}`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden md:inline">Voir</span>
                  </button>
                  <button
                    className="flex min-h-[44px] items-center gap-1.5 px-2.5 text-sm font-bold text-slate-900 underline decoration-2 underline-offset-4 hover:decoration-brand-yellow"
                    onClick={() => downloadDocument(doc)}
                    aria-label={`Télécharger ${doc.name}`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden md:inline">Télécharger</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Zone de dépôt */}
      <section
        aria-label="Ajouter un document"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          setIsAddDialogOpen(true);
        }}
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 rounded-[6px_28px_6px_28px] border-2 border-dashed p-6 transition-colors sm:p-8',
          isDragOver ? 'border-slate-900 bg-slate-50' : 'border-slate-300'
        )}
      >
        <div>
          <h2 className="font-brand text-xl font-bold text-slate-900">Ajouter un document</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Glissez un fichier ici ou choisissez-le sur votre appareil.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 border-slate-900 font-bold text-slate-900 hover:bg-slate-100 sm:h-12 sm:px-6"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <FileText className="mr-1.5 h-4 w-4" />
          Choisir un fichier
        </Button>
      </section>

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

      {/* Aperçu PDF (visionneuse pdf.js authentifiée) */}
      {previewDoc && previewAttachment && previewKind === 'pdf' && (
        <DocumentViewer
          item={previewAttachment}
          open
          onClose={() => setPreviewDoc(null)}
          onDownload={() => void downloadDocument(previewDoc)}
        />
      )}

      {/* Aperçu image / vidéo */}
      {previewDoc && previewAttachment && previewKind !== 'pdf' && (
        <DriverMediaViewer
          items={[previewAttachment]}
          initialIndex={0}
          open
          onClose={() => setPreviewDoc(null)}
          onDownload={() => void downloadDocument(previewDoc)}
        />
      )}
    </div>
  );
}
