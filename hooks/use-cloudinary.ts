/**
 * Hook pour gérer l'upload de fichiers vers Cloudinary
 * Supporte les images, documents, vidéos et autres types de fichiers
 */

/**
 * Upload une image sur Cloudinary et retourne l'URL sécurisée
 * @param imageFile Fichier image à uploader
 * @returns L'URL Cloudinary de l'image
 */
export async function uploadImageToCloudinary(imageFile: File): Promise<string> {
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string;
  
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !uploadPreset) {
    throw new Error("Configuration Cloudinary manquante. Vérifiez vos variables d'environnement.");
  }
  
  const data = new FormData();
  data.append("file", imageFile);
  data.append("upload_preset", uploadPreset);
  
  try {
    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: data
    });
    
    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }
    
    const cloudinary = await res.json();
    
    if (!cloudinary.secure_url) {
      throw new Error("Échec de l'upload de l'image - URL manquante");
    }
    
    return cloudinary.secure_url;
  } catch (err) {
    console.error("Erreur lors de l'upload de l'image:", err);
    throw new Error("Erreur lors de l'upload de l'image");
  }
}

/**
 * Upload un fichier (PDF, docx, zip, etc.) sur Cloudinary (resource_type: 'raw') et retourne l'URL sécurisée
 * @param file Fichier à uploader
 * @returns L'URL Cloudinary du fichier
 */
export async function uploadFileToCloudinary(file: File): Promise<string> {
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string;
  
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !uploadPreset) {
    throw new Error("Configuration Cloudinary manquante. Vérifiez vos variables d'environnement.");
  }
  
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", uploadPreset);
  
  try {
    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: data
    });
    
    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }
    
    const cloudinary = await res.json();
    
    if (!cloudinary.secure_url) {
      throw new Error("Échec de l'upload du fichier - URL manquante");
    }
    
    return cloudinary.secure_url;
  } catch (err) {
    console.error("Erreur lors de l'upload du fichier:", err);
    throw new Error("Erreur lors de l'upload du fichier");
  }
}

/**
 * Upload une vidéo sur Cloudinary et retourne l'URL sécurisée
 * @param videoFile Fichier vidéo à uploader
 * @returns L'URL Cloudinary de la vidéo
 */
export async function uploadVideoToCloudinary(videoFile: File): Promise<string> {
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string;
  
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !uploadPreset) {
    throw new Error("Configuration Cloudinary manquante. Vérifiez vos variables d'environnement.");
  }
  
  const data = new FormData();
  data.append("file", videoFile);
  data.append("upload_preset", uploadPreset);
  
  try {
    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: data
    });
    
    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }
    
    const cloudinary = await res.json();
    
    if (!cloudinary.secure_url) {
      throw new Error("Échec de l'upload de la vidéo - URL manquante");
    }
    
    return cloudinary.secure_url;
  } catch (err) {
    console.error("Erreur lors de l'upload de la vidéo:", err);
    throw new Error("Erreur lors de l'upload de la vidéo");
  }
}

/**
 * Upload automatique basé sur le type de fichier
 * @param file Fichier à uploader
 * @returns L'URL Cloudinary du fichier
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType.startsWith('image/')) {
    return uploadImageToCloudinary(file);
  } else if (fileType.startsWith('video/')) {
    return uploadVideoToCloudinary(file);
  } else {
    // Pour tous les autres types (documents, PDF, etc.)
    return uploadFileToCloudinary(file);
  }
}

/**
 * Obtenir les informations détaillées d'un fichier uploadé
 * @param file Fichier à analyser
 * @returns Informations sur le fichier
 */
export function getFileInfo(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    isImage: file.type.startsWith('image/'),
    isVideo: file.type.startsWith('video/'),
    isDocument: !file.type.startsWith('image/') && !file.type.startsWith('video/'),
    sizeFormatted: formatFileSize(file.size)
  };
}

/**
 * Formater la taille d'un fichier en format lisible
 * @param bytes Taille en bytes
 * @returns Taille formatée (ex: "1.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Valider un fichier avant upload
 * @param file Fichier à valider
 * @param maxSize Taille maximale en bytes (défaut: 10MB)
 * @param allowedTypes Types de fichiers autorisés
 * @returns true si valide, sinon throw une erreur
 */
export function validateFile(
  file: File, 
  maxSize: number = 10 * 1024 * 1024, // 10MB par défaut
  allowedTypes?: string[]
): boolean {
  if (file.size > maxSize) {
    throw new Error(`Le fichier est trop volumineux. Taille maximale: ${formatFileSize(maxSize)}`);
  }
  
  if (allowedTypes && !allowedTypes.some(type => file.type.startsWith(type))) {
    throw new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
  }
  
  return true;
}

// Exemples d'utilisation :
// const imageUrl = await uploadImageToCloudinary(imageFile);
// const documentUrl = await uploadFileToCloudinary(pdfFile);
// const videoUrl = await uploadVideoToCloudinary(videoFile);
// const url = await uploadToCloudinary(anyFile); // Upload automatique basé sur le type
