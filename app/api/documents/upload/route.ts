import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification (sécurisation des uploads privés)
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Non autorisé : jeton Firebase Auth valide requis.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        { error: 'Configuration Cloudinary manquante sur le serveur' },
        { status: 500 }
      );
    }

    // Téléverser directement vers Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', uploadPreset);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryRes.ok) {
      const errText = await cloudinaryRes.text();
      console.error('Erreur Cloudinary API:', errText);
      return NextResponse.json(
        { error: 'Échec du téléversement vers le stockage distant' },
        { status: 502 }
      );
    }

    const cloudinaryData = await cloudinaryRes.json();
    const secureUrl = cloudinaryData.secure_url;
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        name: file.name,
        type: fileExtension.toUpperCase(),
        size: file.size,
        url: secureUrl,
        path: secureUrl,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'upload du document:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur lors du téléversement' },
      { status: 500 }
    );
  }
}
