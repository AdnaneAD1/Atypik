import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/ClientApp';
import { getFileContent } from '@/lib/documents/local-storage';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'ID du document depuis les paramètres de requête
    const url = new URL(request.url);
    const documentId = url.searchParams.get('id');
    
    if (!documentId) {
      return NextResponse.json({ error: 'ID de document manquant' }, { status: 400 });
    }
    
    // Dans une application réelle, nous vérifierions l'authentification ici
    // Pour simplifier, nous supposons que l'utilisateur est authentifié
    
    // Récupérer les informations du document depuis Firestore
    // Utiliser la référence au document directement
    const docRef = doc(db, 'documents', documentId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    const documentData = docSnapshot.data() || {};

    // Pour simplifier, nous ne vérifions pas les autorisations dans cette version
    // Dans une application réelle, nous vérifierions que l'utilisateur est autorisé à télécharger ce document

    // Récupérer le contenu du fichier
    const filePath = documentData.path;
    const fileContent = getFileContent(filePath);

    if (!fileContent) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
    }

    // Déterminer le type MIME en fonction de l'extension du fichier
    const fileExtension = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      // Ajouter d'autres types selon les besoins
    }

    // Créer la réponse avec le contenu du fichier
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${documentData.name}"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Erreur lors du téléchargement du document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
