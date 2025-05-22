import { createUploadthing, type FileRouter } from "uploadthing/next";
import { db } from "@/firebase/ClientApp";
import { collection, addDoc } from "firebase/firestore";

// Créer une instance d'UploadThing avec une clé d'API publique
const f = createUploadthing();

// FileRouter pour les documents des parents
export const ourFileRouter = {
  // Définir le routeur pour les documents
  documentUploader: f({
    pdf: { maxFileSize: "16MB" },
    image: { maxFileSize: "8MB" },
    text: { maxFileSize: "1MB" },
    audio: { maxFileSize: "16MB" },
    video: { maxFileSize: "64MB" }
  })
    .middleware(() => {
      return { userId: "user123" };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complet", file);
      
      // Retourner simplement les informations du fichier pour le client
      // Sans essayer d'enregistrer dans Firestore pour l'instant
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
