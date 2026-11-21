import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hôtes de fichiers autorisés (pièces jointes messagerie/documents)
const ALLOWED_HOSTS = [
  'utfs.io',
  'ufs.sh',
  'uploadthing.com',
  'res.cloudinary.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    (h) => hostname === h || hostname.endsWith(`.${h}`)
  );
}

/**
 * Proxy de lecture de fichiers distants.
 * Garantit un affichage inline (viewer PDF) indépendamment des en-têtes
 * CORS / Content-Disposition de l'hébergeur. Authentifié + whitelist
 * anti-SSRF + rate limiting.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, { maxRequests: 60, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Non autorisé : jeton Firebase Auth valide requis.' },
        { status: 401 }
      );
    }

    const rawUrl = request.nextUrl.searchParams.get('url');
    if (!rawUrl) {
      return NextResponse.json({ error: 'Paramètre url manquant' }, { status: 400 });
    }

    let fileUrl: URL;
    try {
      fileUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
    }

    if (fileUrl.protocol !== 'https:' || !isAllowedHost(fileUrl.hostname)) {
      return NextResponse.json({ error: 'Hôte non autorisé' }, { status: 403 });
    }

    const upstream = await fetch(fileUrl.toString(), {
      headers: request.headers.get('range')
        ? { range: request.headers.get('range') as string }
        : undefined,
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: 'Fichier introuvable ou inaccessible' },
        { status: upstream.status === 404 ? 404 : 502 }
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('content-type') || 'application/pdf');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'private, max-age=300');
    const len = upstream.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    const range = upstream.headers.get('content-range');
    if (range) headers.set('Content-Range', range);
    headers.set('Accept-Ranges', 'bytes');

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error('Erreur proxy fichier:', error);
    return NextResponse.json(
      { error: 'Impossible de charger ce fichier.' },
      { status: 500 }
    );
  }
}
