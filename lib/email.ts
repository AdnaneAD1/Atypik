import nodemailer from 'nodemailer';

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
  });
  return info;
}
