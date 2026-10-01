import { useState } from 'react';
import { uploadToCloudinary } from '@/hooks/use-cloudinary';
import { v4 as uuidv4 } from 'uuid';

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
      // Simuler une progression fluide pendant le transfert Cloudinary
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 90),
        }));
      }, 200);

      // Téléversement direct et pérenne vers Cloudinary
      const secureUrl = await uploadToCloudinary(file);

      clearInterval(progressInterval);

      if (!secureUrl) {
        throw new Error('Échec du téléversement vers Cloudinary');
      }

      const fileExtension = file.name.split('.').pop() || '';
      const fileId = uuidv4();

      setState({
        isUploading: false,
        progress: 100,
        error: null,
      });

      return {
        success: true,
        file: {
          id: fileId,
          name: file.name,
          type: fileExtension.toUpperCase(),
          size: file.size,
          url: secureUrl,
          path: secureUrl,
        },
      };
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
