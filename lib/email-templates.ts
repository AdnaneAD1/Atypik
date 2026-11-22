// Templates e-mail Atypik Driver - design issu de la maquette fournie.
// Tableaux + styles inline pour compatibilité maximale des clients mail.
// Palette : corail #E14C38, rail #f3f5f8, beurre #fff6d9, menthe #e6faf4.

const CORAL = '#E14C38';
const CORAL_DARK = '#C23E2C';
const INK = '#101828';
const MUTE = '#566176';
const RAIL = '#f3f5f8';
const LINE = '#dfe5ec';
const BUTTER = '#fff6d9';
const BUTTER_INK = '#7a4f00';
const MINT = '#e6faf4';
const GO_INK = '#0b7a4e';
const PINK = '#ffe9e9';
const PINK_INK = '#7a2410';

const DISPLAY = "'Trebuchet MS',Arial,sans-serif";
const TEXT = 'Arial,sans-serif';

export type TemplateName =
  | 'accountApproved'
  | 'emailVerification'
  | 'passwordReset'
  | 'transportReminder'
  | 'notification'
  | 'generic';

export type RenderOptions = {
  subject?: string;
  previewText?: string;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://atypik-driver.com').replace(/\/$/, '');
}

function logoUrl() {
  // cid: = image embarquée dans l'e-mail (lib/email.ts) ; EMAIL_LOGO_URL peut pointer vers un CDN
  return process.env.EMAIL_LOGO_URL || 'cid:atypik-logo';
}

function brandHeader() {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:0;">
        <img src="${logoUrl()}" width="180" alt="Atypik Driver" style="display:block;border:0;max-width:180px;height:auto;" />
      </td>
    </tr></table>`;
}

function socialLinks() {
  const socials: Array<{ cid: string; alt: string; url: string }> = [
    { cid: 'cid:atypik-social-facebook', alt: 'Facebook', url: process.env.EMAIL_SOCIAL_FACEBOOK || appUrl() },
    { cid: 'cid:atypik-social-instagram', alt: 'Instagram', url: process.env.EMAIL_SOCIAL_INSTAGRAM || appUrl() },
    { cid: 'cid:atypik-social-linkedin', alt: 'LinkedIn', url: process.env.EMAIL_SOCIAL_LINKEDIN || appUrl() },
    { cid: 'cid:atypik-social-whatsapp', alt: 'WhatsApp', url: process.env.EMAIL_SOCIAL_WHATSAPP || appUrl() },
  ];
  const cells = socials
    .filter(s => s.url)
    .map(s => `<td style="padding-left:10px;"><a href="${escapeHtml(s.url)}" style="display:block;"><img src="${s.cid}" width="32" height="32" alt="${s.alt}" style="display:block;border:0;width:32px;height:32px;"></a></td>`)
    .join('');
  if (!cells) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>${cells}</tr></table>`;
}

function ctaButton(label: string, url: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="border-radius:6px;background:${CORAL};">
        <a href="${escapeHtml(url)}" style="display:block;background:${CORAL};color:#ffffff;font-family:${TEXT};font-size:16px;font-weight:700;line-height:50px;height:50px;padding:0 28px;border-radius:6px;text-decoration:none;text-align:center;">${escapeHtml(label)}</a>
      </td>
    </tr></table>`;
}

function tag(label: string, bg = BUTTER, color = BUTTER_INK) {
  return `<span style="display:inline-block;background:${bg};color:${color};font-family:${TEXT};font-size:13px;font-weight:700;padding:5px 14px;border-radius:99px;">${escapeHtml(label)}</span>`;
}

function h1(text: string) {
  return `<h1 style="margin:16px 0 0 0;font-family:${DISPLAY};font-size:30px;line-height:1.15;font-weight:700;color:${INK};letter-spacing:-0.5px;">${escapeHtml(text)}</h1>`;
}

function p(text: string) {
  return `<p style="margin:14px 0 0 0;font-family:${TEXT};font-size:16px;line-height:1.55;color:${MUTE};">${text}</p>`;
}

export function renderLayout(contentHtml: string, opts: RenderOptions = {}) {
  const safePreview = escapeHtml(opts.previewText || '');

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(opts.subject || 'Atypik Driver')}</title>
<style>
@media (max-width:620px){
  .w{width:100%!important}
  .px{padding-left:20px!important;padding-right:20px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:${RAIL};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${RAIL}"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="w" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:600px;max-width:600px;border:1px solid ${LINE};border-radius:8px;">

  <tr><td class="px" style="padding:32px 40px 0 40px;">${brandHeader()}</td></tr>
  <tr><td class="px" style="padding:32px 40px 44px 40px;">${contentHtml}</td></tr>

  <tr><td bgcolor="${RAIL}" class="px" style="background:${RAIL};padding:28px 40px 36px 40px;border-top:1px solid ${LINE};">
    <p style="margin:0;font-family:${TEXT};font-size:13px;line-height:1.6;color:${MUTE};">Vous recevez cet e-mail car vous utilisez Atypik Driver.<br>
      <a href="${appUrl()}" style="color:${MUTE};text-decoration:underline;">atypik-driver.com</a> &nbsp;·&nbsp; <a href="mailto:contact@atypik-driver.com" style="color:${MUTE};text-decoration:underline;">Nous contacter</a></p>
    ${socialLinks()}
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}

/** Chauffeur : compte validé par l'équipe - il peut se connecter. */
export function accountApprovedTemplate(params: { name?: string }) {
  const title = `Bienvenue ${escapeHtml(params.name || '')} - votre compte est validé`;
  const body = `
    ${tag('Compte validé', MINT, GO_INK)}
    ${h1(`Bienvenue ${escapeHtml(params.name || 'à bord')} !`)}
    ${p(`Bonne nouvelle : votre dossier chauffeur vient d'être <b style="color:${INK};">validé par nos équipes</b>. Vous pouvez dès maintenant vous connecter à votre espace et recevoir vos premières missions.`)}
    <div style="padding:28px 0 0 0;">${ctaButton('Accéder à mon espace', `${appUrl()}/login`)}</div>
    ${p(`Votre profil sera proposé aux familles de votre région. Pensez à compléter vos informations pour inspirer confiance.`)}
  `;
  return renderLayout(body, { subject: 'Votre compte chauffeur Atypik est validé', previewText: 'Bonne nouvelle : votre dossier a été validé. Connectez-vous pour recevoir vos missions.' });
}

/** Bienvenue + validation de l'adresse e-mail après création de compte. */
export function emailVerificationTemplate(params: {
  name?: string;
  role?: 'parent' | 'driver' | string;
  verifyUrl: string;
}) {
  const isDriver = params.role === 'driver';
  const body = `
    ${tag('Bienvenue', MINT, GO_INK)}
    ${h1(`Bienvenue${params.name ? ` ${escapeHtml(params.name)}` : ''}, confirmez votre adresse`)}
    ${p(`Votre compte ${isDriver ? 'chauffeur' : 'parent'} Atypik Driver vient d'être créé. Une dernière étape : confirmez que cette adresse e-mail vous appartient.`)}
    <div style="padding:28px 0 0 0;">${ctaButton('Confirmer mon adresse e-mail', params.verifyUrl)}</div>
    ${p(isDriver
      ? `Votre dossier sera ensuite examiné par nos équipes - vous recevrez un e-mail dès sa validation.`
      : `Nos équipes vous assigneront ensuite un chauffeur de notre réseau pour les transports de vos enfants.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PINK}" style="background:${PINK};border-radius:6px;margin-top:28px;"><tr>
      <td style="padding:14px 18px;font-family:${TEXT};font-size:14px;line-height:1.45;color:${PINK_INK};"><b>À savoir</b> - si vous n'avez pas créé ce compte, ignorez simplement cet e-mail.</td>
    </tr></table>
  `;
  return renderLayout(body, {
    subject: 'Confirmez votre adresse e-mail - Atypik Driver',
    previewText: 'Votre compte est créé - confirmez votre adresse e-mail pour l’activer.',
  });
}

/** Mot de passe oublié : lien de réinitialisation custom (hors page Firebase). */
export function passwordResetTemplate(params: { name?: string; resetUrl: string }) {
  const body = `
    ${tag('Sécurité du compte')}
    ${h1('Réinitialisez votre mot de passe')}
    ${p(`Bonjour${params.name ? ` <b style="color:${INK};">${escapeHtml(params.name)}</b>` : ''}, nous avons reçu une demande de réinitialisation de votre mot de passe Atypik Driver.`)}
    <div style="padding:28px 0 0 0;">${ctaButton('Choisir un nouveau mot de passe', params.resetUrl)}</div>
    ${p(`Ce lien est valable <b style="color:${INK};">1 heure</b>. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : votre mot de passe reste inchangé.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PINK}" style="background:${PINK};border-radius:6px;margin-top:28px;"><tr>
      <td style="padding:14px 18px;font-family:${TEXT};font-size:14px;line-height:1.45;color:${PINK_INK};"><b>À savoir</b> - ne partagez jamais ce lien. Nos équipes ne vous demanderont jamais votre mot de passe.</td>
    </tr></table>
  `;
  return renderLayout(body, { subject: 'Réinitialisation de votre mot de passe', previewText: 'Un lien sécurisé pour choisir un nouveau mot de passe.' });
}

/** Rappel / proposition de transport avec infos trajet. */
export function transportReminderTemplate(params: {
  childName?: string;
  childAvatar?: string;
  date?: string;
  time?: string;
  from?: string;
  to?: string;
  transportType?: string;
}) {
  const title = `Transport ${escapeHtml(params.childName || '')}`;
  const childRow = params.childName ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
      ${params.childAvatar ? `<td width="64" style="padding-right:16px;"><img src="${escapeHtml(params.childAvatar)}" width="64" height="64" alt="" style="width:64px;height:64px;border-radius:32px;border:0;"></td>` : ''}
      <td style="font-family:${TEXT};">
        <div style="font-family:${DISPLAY};font-size:22px;font-weight:700;color:${INK};">${escapeHtml(params.childName)}</div>
        ${params.transportType ? `<div style="margin-top:6px;">${tag(params.transportType)}</div>` : ''}
      </td>
    </tr></table>` : '';

  const steps = params.from || params.to ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${TEXT};margin-top:20px;">
      ${params.from ? `<tr><td width="26" valign="top" style="font-size:18px;line-height:24px;color:#12a06a;">&#9679;</td><td style="padding-bottom:14px;font-size:16px;line-height:1.4;color:${INK};"><b>${escapeHtml(params.from)}</b>${params.time ? `<br><span style="color:${MUTE};font-size:14px;">Départ à ${escapeHtml(params.time)}</span>` : ''}</td></tr>` : ''}
      ${params.to ? `<tr><td width="26" valign="top" style="font-size:18px;line-height:24px;color:${CORAL};">&#9679;</td><td style="font-size:16px;line-height:1.4;color:${INK};"><b>${escapeHtml(params.to)}</b><br><span style="color:${MUTE};font-size:14px;">Destination</span></td></tr>` : ''}
    </table>` : '';

  const body = `
    ${tag('Transport')}
    ${h1(title)}
    ${params.date ? p(`${escapeHtml(params.date)}`) : ''}
    ${childRow}
    ${steps}
  `;
  return renderLayout(body, { subject: `Transport ${params.childName || ''} - ${params.date || 'rappel'}`, previewText: `Transport pour ${params.childName || 'votre enfant'} ${params.date || ''}` });
}

/** Notification générique - utilisée pour tous les événements in-app. */
export function notificationTemplate(params: {
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  tag?: string;
}) {
  const body = `
    ${params.tag ? tag(params.tag) : tag('Notification')}
    ${h1(params.title)}
    ${p(escapeHtml(params.message))}
    ${params.ctaUrl ? `<div style="padding:28px 0 0 0;">${ctaButton(params.ctaLabel || 'Voir dans l’application', params.ctaUrl)}</div>` : ''}
  `;
  return renderLayout(body, { subject: params.title, previewText: params.message.slice(0, 120) });
}

export function genericTemplate(params: { title: string; messageHtml?: string; messageText?: string }) {
  return notificationTemplate({
    title: params.title || 'Notification Atypik Driver',
    message: params.messageText || '',
    ...(params.messageHtml ? { message: params.messageText || '' } : {}),
  });
}

export function buildEmailHtml(template: TemplateName, vars: Record<string, any>) {
  switch (template) {
    case 'accountApproved':
      return accountApprovedTemplate(vars || {});
    case 'emailVerification':
      return emailVerificationTemplate({ name: vars?.name, role: vars?.role, verifyUrl: vars?.verifyUrl || '#' });
    case 'passwordReset':
      return passwordResetTemplate({ name: vars?.name, resetUrl: vars?.resetUrl || '#' });
    case 'transportReminder':
      return transportReminderTemplate(vars || {});
    case 'notification':
      return notificationTemplate({
        title: vars?.title || 'Notification',
        message: vars?.message || '',
        ctaLabel: vars?.ctaLabel,
        ctaUrl: vars?.ctaUrl,
        tag: vars?.tag,
      });
    case 'generic':
    default:
      return genericTemplate({ title: vars?.title || 'Notification', messageHtml: vars?.messageHtml, messageText: vars?.messageText });
  }
}

export { CORAL_DARK, escapeHtml };
