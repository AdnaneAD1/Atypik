import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
import { getFileContent } from '@/lib/documents/local-storage';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification obligatoire
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Non autorisé : jeton Firebase Auth valide requis.' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'ID de document manquant' }, { status: 400 });
    }

    // Récupérer le document depuis Firestore avec Firebase Admin (côté serveur sécurisé)
    const docSnap = await adminDb().collection('documents').doc(documentId).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    const documentData = docSnap.data() || {};

    // Vérifier les permissions (le propriétaire, les utilisateurs partagés ou un admin)
    const isOwner = documentData.userId === authUser.uid;
    const isShared = Array.isArray(documentData.sharedWith) && documentData.sharedWith.includes(authUser.uid);
    const isAdmin = authUser.role === 'admin';

    if (!isOwner && !isShared && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé à ce document' }, { status: 403 });
    }

    // 2. Si le document est stocké sur Cloudinary (URL distante)
    const fileUrl: string | undefined = documentData.url || documentData.path;
    if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
      return NextResponse.redirect(fileUrl, { status: 302 });
    }

    // 3. Fallback pour anciens fichiers locaux de développement
    const filePath = documentData.path;
    const fileContent = filePath ? getFileContent(filePath) : null;

    if (!fileContent) {
      return NextResponse.json({ error: 'Fichier physique introuvable' }, { status: 404 });
    }

    const fileExtension = path.extname(filePath || '').toLowerCase();
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
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    return new NextResponse(fileContent as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(documentData.name || 'document')}"`,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du document:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur lors du téléchargement' },
      { status: 500 }
    );
  }
}
