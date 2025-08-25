// Reusable HTML email templates for Atypik brand
// Uses inline styles for broad email client compatibility

export type TemplateName = 'accountApproved' | 'transportReminder' | 'generic';

export type RenderOptions = {
  subject?: string;
  previewText?: string;
  primaryColor?: string; // fallback if env not set
  logoUrl?: string; // absolute or CID via provider
  appName?: string;
  footerText?: string;
};

function getBrandDefaults() {
  const primaryColor = process.env.EMAIL_BRAND_PRIMARY || '#4f46e5'; // indigo-600 fallback
  const appName = process.env.EMAIL_BRAND_NAME || 'Atypik';
  const logoUrl = process.env.EMAIL_BRAND_LOGO_URL || '';
  const footerText = process.env.EMAIL_BRAND_FOOTER || `${appName} — Simplifiez vos transports familiaux.`;
  const accentColor = process.env.EMAIL_BRAND_ACCENT || '#ef4444'; // red-500 fallback for 'Atypik'
  const driverColor = process.env.EMAIL_BRAND_DRIVER || '#facc15'; // yellow-400 for 'Driver'
  return { primaryColor, accentColor, driverColor, appName, logoUrl, footerText };
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderLayout(contentHtml: string, opts: RenderOptions = {}) {
  const { primaryColor, accentColor, driverColor, appName, logoUrl, footerText } = { ...getBrandDefaults(), ...opts } as any;
  const safePreview = escapeHtml(opts.previewText || '');

  const headTitle = (() => {
    const name = String(appName || 'Atypik');
    if (name.toLowerCase() === 'atypikdriver' || name.includes('Atypik')) return 'AtypikDriver';
    return name;
  })();

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(opts.subject || headTitle)}</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .card { background: #111827 !important; color: #e5e7eb !important; }
        .muted { color: #9ca3af !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,'Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji';">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${safePreview}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding:0 24px 16px 24px; text-align:center;">
                ${logoUrl ? `<div style=\"margin-bottom:8px;\"><img src=\"${logoUrl}\" height=\"36\" alt=\"${escapeHtml(appName)}\" style=\"display:inline-block;vertical-align:middle;\" /></div>` : ''}
                ${(() => {
                  const name = String(appName || 'Atypik');
                  if (name.toLowerCase() === 'atypikdriver' || name.includes('Atypik')) {
                    return `<span style=\"font-size:24px;font-weight:800;color:${accentColor};\">Atypik</span><span style=\"font-size:24px;font-weight:800;color:${driverColor};\">Driver</span>`;
                  }
                  return `<span style=\"font-size:24px;font-weight:800;color:${primaryColor};\">${escapeHtml(name)}</span>`;
                })()}
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="card" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="padding:24px 24px 0 24px;">
                      <!-- header bar -->
                      <div style="height:4px;width:64px;background:${accentColor};border-radius:999px;margin:0 0 16px 0;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 24px 24px;">
                      ${contentHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding:8px 24px 0 24px;">
                <div class="muted" style="color:#6b7280;font-size:12px;line-height:18px;">${escapeHtml(footerText)}</div>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding:8px 24px 24px 24px;">
                <div class="muted" style="color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} ${escapeHtml(appName)}. Tous droits réservés.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function accountApprovedTemplate(params: { name?: string }) {
  const title = 'Votre compte chauffeur a été validé';
  const body = `
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:28px;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 12px 0;color:#374151;">Bonjour ${escapeHtml(params.name || '')},</p>
    <p style="margin:0 0 16px 0;color:#374151;">
      Bonne nouvelle ! Votre profil chauffeur vient d’être approuvé. Vous pouvez désormais vous connecter et commencer à accepter des missions.
    </p>
    <p style="margin:0;color:#374151;">Merci de faire partie d’Atypik.</p>
  `;
  return renderLayout(body, { subject: title, previewText: title });
}

export function transportReminderTemplate(params: { childName?: string; date?: string; from?: string; to?: string }) {
  const title = 'Rappel de transport';
  const body = `
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:28px;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 12px 0;color:#374151;">Transport pour ${escapeHtml(params.childName || 'votre enfant')}</p>
    <ul style="margin:0 0 16px 18px;color:#374151;">
      ${params.date ? `<li>Date: ${escapeHtml(params.date)}</li>` : ''}
      ${params.from ? `<li>Départ: ${escapeHtml(params.from)}</li>` : ''}
      ${params.to ? `<li>Arrivée: ${escapeHtml(params.to)}</li>` : ''}
    </ul>
    <p style="margin:0;color:#374151;">Vous pouvez suivre le trajet en temps réel dans l’application.</p>
  `;
  return renderLayout(body, { subject: title, previewText: title });
}

export function genericTemplate(params: { title: string; messageHtml?: string; messageText?: string }) {
  const title = params.title || 'Notification Atypik';
  const body = `
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:28px;">${escapeHtml(title)}</h1>
    ${params.messageHtml ? params.messageHtml : `<p style=\"margin:0;color:#374151;\">${escapeHtml(params.messageText || '')}</p>`}
  `;
  return renderLayout(body, { subject: title, previewText: params.messageText || title });
}

export function buildEmailHtml(template: TemplateName, vars: Record<string, any>) {
  switch (template) {
    case 'accountApproved':
      return accountApprovedTemplate(vars || {});
    case 'transportReminder':
      return transportReminderTemplate(vars || {});
    case 'generic':
    default:
      return genericTemplate({ title: vars?.title || 'Notification', messageHtml: vars?.messageHtml, messageText: vars?.messageText });
  }
}
