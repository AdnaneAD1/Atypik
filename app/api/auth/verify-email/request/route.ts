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
  role: z.enum(['parent', 'driver']).optional(),
});

// Réponse générique : ne jamais révéler si le compte existe.
const GENERIC_OK = { success: true };

export async function POST(req: Request) {
  try {
    const rateLimit = checkRateLimit(req, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const { email, role } = BodySchema.parse(await req.json());

    if (!admin.apps.length) {
      console.error('[verify-email] firebase-admin non initialisé (FIREBASE_* manquants).');
      return NextResponse.json(GENERIC_OK);
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');

    let verifyUrl: string | null = null;
    let displayName: string | undefined;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      displayName = userRecord.displayName || undefined;
      if (!userRecord.emailVerified) {
        const firebaseLink = await admin.auth().generateEmailVerificationLink(email, {
          url: `${appUrl}/login`,
        });
        const oobCode = new URL(firebaseLink).searchParams.get('oobCode');
        if (oobCode) {
          verifyUrl = `${appUrl}/verify-email?oobCode=${encodeURIComponent(oobCode)}`;
        }
      }
    } catch (e: any) {
      if (e?.code !== 'auth/user-not-found') {
        console.warn('[verify-email] generate link failed:', e?.message || e);
      }
    }

    if (verifyUrl) {
      try {
        const html = buildEmailHtml('emailVerification', { name: displayName, role, verifyUrl });
        await sendEmail({ to: email, subject: 'Confirmez votre adresse e-mail - Atypik Driver', html });
      } catch (mailErr: any) {
        console.error('[verify-email] envoi e-mail échoué:', mailErr?.message || mailErr);
      }
    }

    return NextResponse.json(GENERIC_OK);
  } catch (err: any) {
    const status = err?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({ error: 'Requête invalide.' }, { status });
  }
}
