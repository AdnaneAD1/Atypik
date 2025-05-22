"use client";
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message } from '@/hooks/use-messages';
import { Send, Paperclip, X, Image as ImageIcon, File, Reply } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DriverMessageInputProps {
  onSendMessage: (content: string, files: File[]) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function DriverMessageInput({
  onSendMessage,
  replyingTo,
  onCancelReply,
  isUploading,
  uploadProgress
}: DriverMessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message, files);
      setMessage('');
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
      // Réinitialiser l'input file pour permettre de sélectionner à nouveau le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const getFileIcon = (file: File) => {
    const fileType = file.type;
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="border-t p-3">
      {/* Affichage du bloc de réponse */}
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
          <Reply className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 truncate text-xs">
            <span className="font-semibold">Réponse à :</span> {replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Affichage des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1 text-sm"
            >
              {getFileIcon(file)}
              <span className="truncate max-w-[150px]">{file.name}</span>
              <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Barre de progression upload */}
      {isUploading && (
        <div className="mb-2">
          <Progress value={uploadProgress} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Input
          className="flex-1"
          placeholder="Écrire un message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isUploading}
        />
        <Button
          onClick={handleSend}
          disabled={isUploading || (!message.trim() && files.length === 0)}
        >
          <Send className="h-4 w-4 mr-1" /> Envoyer
        </Button>
      </div>
    </div>
  );
}
