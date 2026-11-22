import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';
import { buildEmailHtml } from '@/lib/email-templates';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().email(),
});

// Réponse générique : ne jamais révéler si le compte existe (anti-énumération).
const GENERIC_OK = { success: true, message: 'Si un compte existe, un e-mail de réinitialisation vient d’être envoyé.' };

export async function POST(req: Request) {
  try {
    // Anti-abus : 5 demandes / min / IP (endpoint public par nature)
    const rateLimit = checkRateLimit(req, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const { email } = BodySchema.parse(await req.json());

    if (!admin.apps.length) {
      console.error('[reset-password] firebase-admin non initialisé (FIREBASE_* manquants).');
      return NextResponse.json(GENERIC_OK);
    }

    // Lien signé Firebase → on réécrit l'URL vers notre page dédiée
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
    const continueUrl = `${appUrl}/login`;

    let resetUrl: string | null = null;
    let displayName: string | undefined;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      displayName = userRecord.displayName || undefined;
      const firebaseLink = await admin.auth().generatePasswordResetLink(email, { url: continueUrl });
      const oobCode = new URL(firebaseLink).searchParams.get('oobCode');
      if (oobCode) {
        resetUrl = `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`;
      }
    } catch (e: any) {
      // auth/user-not-found ou autre → réponse générique, rien envoyé
      if (e?.code !== 'auth/user-not-found') {
        console.warn('[reset-password] generate link failed:', e?.message || e);
      }
    }

    if (resetUrl) {
      try {
        const html = buildEmailHtml('passwordReset', { name: displayName, resetUrl });
        await sendEmail({ to: email, subject: 'Réinitialisation de votre mot de passe', html });
      } catch (mailErr: any) {
        console.error('[reset-password] envoi e-mail échoué:', mailErr?.message || mailErr);
        // En cas d'échec SMTP on ne bloque pas l'UX : le client affiche le message générique.
      }
    }

    return NextResponse.json(GENERIC_OK);
  } catch (err: any) {
    const status = err?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({ error: 'Requête invalide.' }, { status });
  }
}
