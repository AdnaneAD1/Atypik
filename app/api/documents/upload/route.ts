import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Dossier de stockage des documents
const DOCUMENTS_DIR = path.join(process.cwd(), 'public', 'documents');

export async function POST(request: NextRequest) {
  try {
    // S'assurer que la requu00eate est multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Gu00e9nu00e9rer un nom de fichier unique
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = path.join(DOCUMENTS_DIR, fileName);

    // Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Cru00e9er le dossier s'il n'existe pas
    try {
      await mkdir(DOCUMENTS_DIR, { recursive: true });
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('Erreur lors de l\'u00e9criture du fichier:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du fichier' }, { status: 500 });
    }

    // Construire l'URL publique
    const fileUrl = `/documents/${fileName}`;

    // Retourner les informations du fichier
    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        name: file.name,
        type: fileExtension.toUpperCase(),
        size: file.size,
        url: fileUrl,
        path: filePath,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
