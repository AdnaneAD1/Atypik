import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { buildEmailHtml } from '@/lib/email-templates';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 0. Protection anti-flood / rate limiting (max 20 e-mails / min par IP)
    const rateLimit = checkRateLimit(req, { maxRequests: 20, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    // 1. Authentification obligatoire : bloque les bots et usurpations de serveur SMTP
    const authUser = await verifyAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé : jeton Firebase Auth valide requis.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { to, subject, html, text, from, template, variables } = body || {} as {
      to?: string | string[];
      subject?: string;
      html?: string;
      text?: string;
      from?: string;
      template?: string;
      variables?: Record<string, any>;
    };

    // If html missing but a template is provided, render it
    let finalHtml = html as string | undefined;
    if (!finalHtml && template) {
      try {
        finalHtml = buildEmailHtml(template as any, variables || {});
      } catch (e) {
        console.warn('Template rendering failed:', e);
      }
    }

    if (!to || !subject || (!finalHtml && !text)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: to, subject, et html ou text (ou template) sont requis.' },
        { status: 400 }
      );
    }

    await sendEmail({ to, subject, html: finalHtml, text, from });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
