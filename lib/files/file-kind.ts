export type FileKind = 'pdf' | 'image' | 'video' | 'other';

const IMAGE_EXTS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif', 'heic', 'heif',
]);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v']);

function extensionOf(value?: string): string {
  const clean = (value ?? '').split('?')[0].split('#')[0];
  const match = clean.match(/\.([a-zA-Z0-9]{1,10})$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Détermine si un fichier peut être visualisé dans l'application.
 * `type` peut contenir un MIME (image/jpeg), une extension nue (PDF)
 * ou un libellé métier — l'extension de l'URL/nom fait foi en priorité
 * car `type` n'est pas toujours fiable selon la source du document.
 */
export function getFileKind(file: { name?: string; url?: string; type?: string }): FileKind {
  const type = (file.type ?? '').toLowerCase();
  if (type === 'application/pdf' || type === 'pdf') return 'pdf';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';

  const ext = extensionOf(file.url) || extensionOf(file.name) || (type && !type.includes('/') ? type : '');

  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (VIDEO_EXTS.has(ext)) return 'video';
  return 'other';
}
