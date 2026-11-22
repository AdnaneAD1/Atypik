import { describe, it, expect } from 'vitest';
import { getFileKind } from '../file-kind';

describe('getFileKind', () => {
  it('détecte un PDF via le type MIME', () => {
    expect(getFileKind({ type: 'application/pdf', name: 'doc', url: 'https://x/f' })).toBe('pdf');
  });

  it('détecte un PDF via le libellé stocké (PDF en majuscules)', () => {
    expect(getFileKind({ type: 'PDF', name: 'contrat', url: 'https://x/f' })).toBe('pdf');
  });

  it('détecte un PDF via l\'extension de l\'URL', () => {
    expect(getFileKind({ type: 'DOC', name: 'contrat', url: 'https://x/f.pdf' })).toBe('pdf');
  });

  it('détecte un PDF via l\'extension du nom même si l\'URL est opaque', () => {
    expect(getFileKind({ name: 'contrat.pdf', url: 'https://utfs.io/f/abc123' })).toBe('pdf');
  });

  it('ignore les paramètres de requête dans l\'URL', () => {
    expect(getFileKind({ url: 'https://x/f.png?v=2&token=1' })).toBe('image');
  });

  it('détecte une image via le type MIME', () => {
    expect(getFileKind({ type: 'image/jpeg', url: 'https://x/f' })).toBe('image');
  });

  it('détecte une image via un libellé/extension', () => {
    expect(getFileKind({ type: 'JPG', url: 'https://x/f' })).toBe('image');
    expect(getFileKind({ name: 'photo.webp', url: 'https://x/f' })).toBe('image');
  });

  it('détecte une vidéo via le type MIME ou l\'extension', () => {
    expect(getFileKind({ type: 'video/mp4', url: 'https://x/f' })).toBe('video');
    expect(getFileKind({ name: 'clip.mov', url: 'https://x/f' })).toBe('video');
  });

  it('classe les formats non visualisables en other', () => {
    expect(getFileKind({ type: 'DOCX', name: 'note', url: 'https://x/f' })).toBe('other');
    expect(getFileKind({ name: 'archive.zip', url: 'https://x/f' })).toBe('other');
    expect(getFileKind({ name: 'sans-extension', url: 'https://x/f' })).toBe('other');
  });
});
