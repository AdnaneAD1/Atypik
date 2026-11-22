'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadToCloudinary } from '@/hooks/use-cloudinary';
import { Upload } from 'lucide-react';
import { LoaderDots } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { FormDialogShell, formDialogContentClass } from '@/components/ui/form-dialog-shell';

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentAdded: (document: any) => void;
}

export function AddDocumentDialog({ open, onOpenChange, onDocumentAdded }: AddDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('PDF');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-remplir le nom du document avec le nom du fichier
      if (!documentName) {
        setDocumentName(selectedFile.name.split('.')[0]);
      }
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!file || !documentName) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier et donner un nom au document',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Vérifier la taille du fichier (100MB max)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale autorisée est de 100MB',
          variant: 'destructive',
        });
        return;
      }
      
      // Upload du fichier vers Cloudinary
      const fileUrl = await uploadToCloudinary(file);
      
      // Créer le document avec les données du fichier
      const documentData = {
        name: documentName,
        type: documentType,
        size: `${Math.round(file.size / 1024)} KB`,
        status: 'validated',
        tags: tags.length > 0 ? tags : ['Document'],
        url: fileUrl,
        path: fileUrl,
      };
      
      onDocumentAdded(documentData);
      
      toast({
        title: 'Document ajouté',
        description: 'Le document a été ajouté avec succès',
      });
      
      // Réinitialiser le formulaire
      setFile(null);
      setDocumentName('');
      setDocumentType('PDF');
      setTags([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'ajout du document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${formDialogContentClass} sm:max-w-[760px]`}>
        <FormDialogShell caption="Vos documents, toujours à portée de main">
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Fichier</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="flex-1"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              />
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nom du document</Label>
            <Input
              id="name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Entrez un nom pour le document"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type de document</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="DOC">DOC</SelectItem>
                <SelectItem value="DOCX">DOCX</SelectItem>
                <SelectItem value="JPG">JPG</SelectItem>
                <SelectItem value="PNG">PNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                Ajouter
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1 bg-primary/5 text-primary border-primary/20">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-10 w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="h-10 w-full bg-primary text-white hover:bg-primary/90 sm:w-auto" disabled={isUploading}>
            {isUploading ? (
              <>
                <LoaderDots className="mr-2" />
                Chargement...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter
              </>
            )}
          </Button>
        </DialogFooter>
        </FormDialogShell>
      </DialogContent>
    </Dialog>
  );
}
