import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Images embarquées dans l'e-mail (cid:) — visibles même si l'URL publique n'est pas accessible
export const EMAIL_LOGO_CID = 'atypik-logo';
export const EMAIL_SOCIAL_CIDS = {
  facebook: 'atypik-social-facebook',
  instagram: 'atypik-social-instagram',
  linkedin: 'atypik-social-linkedin',
  whatsapp: 'atypik-social-whatsapp',
} as const;

function brandAttachments() {
  const files: Array<{ cid: string; rel: string }> = [
    { cid: EMAIL_LOGO_CID, rel: 'logo-atypik.png' },
    { cid: EMAIL_SOCIAL_CIDS.facebook, rel: 'email/facebook.png' },
    { cid: EMAIL_SOCIAL_CIDS.instagram, rel: 'email/instagram.png' },
    { cid: EMAIL_SOCIAL_CIDS.linkedin, rel: 'email/linkedin.png' },
    { cid: EMAIL_SOCIAL_CIDS.whatsapp, rel: 'email/whatsapp.png' },
  ];
  const out: Array<{ filename: string; path: string; cid: string }> = [];
  for (const f of files) {
    const p = path.join(process.cwd(), 'public', f.rel);
    if (fs.existsSync(p)) out.push({ filename: path.basename(p), path: p, cid: f.cid });
  }
  return out;
}

// Singleton transporter to avoid re-creating between hot reloads
let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const secure = process.env.SMTP_SECURE === 'true' || (port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) {
  const { to, subject, html, text, from } = options;
  const defaultFrom = process.env.EMAIL_FROM || 'no-reply@localhost';
  const tx = getEmailTransporter();
  const info = await tx.sendMail({
    from: from || defaultFrom,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
    attachments: brandAttachments(),
  });
  return info;
}
