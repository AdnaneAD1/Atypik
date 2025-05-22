'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message } from '@/hooks/use-messages';
import { Send, Paperclip, X, Image as ImageIcon, File, Reply } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MessageInputProps {
  onSendMessage: (content: string, files: File[]) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  isUploading: boolean;
  uploadProgress: number;
}

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
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 rounded-full" 
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Affichage de la réponse */}
      {replyingTo && (
        <div className="mb-3 flex items-center justify-between bg-secondary/50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Reply className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <span>Réponse à: </span>
              <span className="font-medium">
                {replyingTo.content.substring(0, 50)}
                {replyingTo.content.length > 50 ? '...' : ''}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Barre de progression de l'upload */}
      {isUploading && (
        <div className="mb-3">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Envoi en cours... {uploadProgress}%</p>
        </div>
      )}
      
      {/* Entrée de message */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Paperclip className="h-5 w-5" />
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            multiple 
          />
        </Button>
        
        <Input
          placeholder="Écrivez votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isUploading}
          className="flex-1"
        />
        
        <Button 
          className="bg-primary hover:bg-primary/90" 
          size="icon" 
          onClick={handleSend}
          disabled={isUploading || (message.trim() === '' && files.length === 0)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
