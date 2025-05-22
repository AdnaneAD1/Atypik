import { useState } from 'react';

type FileUploadState = {
  isUploading: boolean;
  progress: number;
  error: string | null;
};

type UploadResponse = {
  success: boolean;
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    path: string;
  };
};

export function useFileUpload() {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadFile = async (file: File): Promise<UploadResponse | null> => {
    if (!file) return null;

    setState({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simuler la progression de l'upload
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 300);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      setState({
        isUploading: false,
        progress: 100,
        error: null,
      });

      return await response.json();
    } catch (error) {
      setState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      return null;
    }
  };

  return {
    ...state,
    uploadFile,
  };
}
