'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Message } from '@/hooks/use-messages';
import { Send, Paperclip, X, Image as ImageIcon, FileText, Film, File, Reply } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface MessageInputProps {
  onSendMessage: (content: string, files: File[]) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  isUploading: boolean;
  uploadProgress: number;
}

// Limites alignées sur le routeur UploadThing (app/api/uploadthing/core.ts)
const FILE_LIMITS = {
  image: { maxSize: 8 * 1024 * 1024, label: '8 Mo' },
  video: { maxSize: 64 * 1024 * 1024, label: '64 Mo' },
  other: { maxSize: 16 * 1024 * 1024, label: '16 Mo' },
};
const MAX_FILES = 10;

const ACCEPTS = {
  media: 'image/*,video/*',
  document: '.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.zip',
};

export function MessageInput({
  onSendMessage,
  replyingTo,
  onCancelReply,
  isUploading,
  uploadProgress
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const limit = file.type.startsWith('image/')
      ? FILE_LIMITS.image
      : file.type.startsWith('video/')
      ? FILE_LIMITS.video
      : FILE_LIMITS.other;
    if (file.size > limit.maxSize) {
      return `"${file.name}" dépasse la limite de ${limit.label}`;
    }
    return null;
  };

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      try {
        onSendMessage(message, files);
        setMessage('');
        setFiles([]);
      } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        toast({
          title: 'Erreur',
          description: 'Erreur lors de l\'envoi du message',
          variant: 'destructive',
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openPicker = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const incoming = Array.from(e.target.files);

    const rejected = incoming.map(validateFile).filter(Boolean) as string[];
    const accepted = incoming.filter(f => !validateFile(f));

    if (rejected.length > 0) {
      toast({ title: 'Fichier trop volumineux', description: rejected.join('\n'), variant: 'destructive' });
    }

    const room = MAX_FILES - files.length;
    if (accepted.length > room) {
      toast({ title: 'Trop de fichiers', description: `Maximum ${MAX_FILES} fichiers par message.`, variant: 'destructive' });
    }
    if (room > 0) {
      setFiles(prev => [...prev, ...accepted.slice(0, room)]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Film className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="p-3">
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-secondary px-3 py-2">
          <Reply className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1 truncate text-xs">
            <span className="font-semibold">Réponse à :</span> {replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '…' : ''}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelReply} aria-label="Annuler la réponse">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            file.type.startsWith('image/') ? (
              <div key={index} className="group relative h-16 w-16 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label={`Retirer ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div key={index} className="flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2 text-sm">
                {getFileIcon(file)}
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Retirer ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          ))}
        </div>
      )}

      {isUploading && (
        <div className="mb-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Envoi en cours… {uploadProgress}%</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isUploading} aria-label="Joindre un fichier">
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem onSelect={() => openPicker(ACCEPTS.media)} className="gap-2.5">
              <ImageIcon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Photo ou vidéo</p>
                <p className="text-xs text-muted-foreground">Image 8 Mo · Vidéo 64 Mo</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openPicker(ACCEPTS.document)} className="gap-2.5">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Document</p>
                <p className="text-xs text-muted-foreground">PDF, Word… jusqu&apos;à 16 Mo</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
          disabled={isUploading}
        />

        <input
          className="flex h-11 flex-1 rounded-xl border border-input bg-secondary/50 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
          placeholder="Écrivez votre message…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isUploading}
          aria-label="Écrire un message"
        />
        <Button
          onClick={handleSend}
          disabled={isUploading || (!message.trim() && files.length === 0)}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl"
          aria-label="Envoyer"
        >
          <Send className="h-[18px] w-[18px] -translate-x-px translate-y-px" />
        </Button>
      </div>
    </div>
  );
}
