import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { buildEmailHtml } from '@/lib/email-templates';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
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
