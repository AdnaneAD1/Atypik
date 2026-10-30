import { createUploadthing, type FileRouter } from "uploadthing/next";
import { verifyAuthToken } from "@/lib/firebase/admin-auth";

// Créer une instance d'UploadThing
const f = createUploadthing();

// FileRouter pour les documents des parents et chauffeurs
export const ourFileRouter = {
  // Définir le routeur pour les documents
  documentUploader: f({
    pdf: { maxFileSize: "16MB" },
    image: { maxFileSize: "8MB" },
    text: { maxFileSize: "1MB" },
    audio: { maxFileSize: "16MB" },
    video: { maxFileSize: "64MB" }
  })
    .middleware(async ({ req }) => {
      const authUser = await verifyAuthToken(req);
      if (authUser) {
        return { userId: authUser.uid };
      }
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
      if (!token) {
        throw new Error("Authentification requise pour téléverser");
      }
      return { userId: "authenticated_user" };
    })
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
