import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Dossier de stockage des documents
const DOCUMENTS_DIR = path.join(process.cwd(), 'public', 'documents');

// S'assurer que le dossier existe
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

/**
 * Sauvegarde un fichier dans le dossier local
 * @param file Le fichier u00e0 sauvegarder
 * @param userId L'ID de l'utilisateur
 * @returns Les informations du fichier sauvegardu00e9
 */
export const saveFile = async (file: File, userId: string) => {
  try {
    // Gu00e9nu00e9rer un nom de fichier unique
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = path.join(DOCUMENTS_DIR, fileName);

    // Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // u00c9crire le fichier sur le disque
    fs.writeFileSync(filePath, buffer);

    // Construire l'URL publique
    const fileUrl = `/documents/${fileName}`;

    return {
      id: fileId,
      name: file.name,
      type: fileExtension.toUpperCase(),
      size: `${Math.round(file.size / 1024)} KB`,
      path: filePath,
      url: fileUrl,
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier:', error);
    throw new Error('Impossible de sauvegarder le fichier');
  }
};

/**
 * Supprime un fichier du dossier local
 * @param filePath Le chemin du fichier u00e0 supprimer
 * @returns true si la suppression a ru00e9ussi, false sinon
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return false;
  }
};

/**
 * Ru00e9cupu00e8re le contenu d'un fichier
 * @param filePath Le chemin du fichier u00e0 lire
 * @returns Le contenu du fichier en tant que Buffer
 */
export const getFileContent = (filePath: string): Buffer | null => {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    return null;
  }
};
