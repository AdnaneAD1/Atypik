"use client";

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download, X, FileText, ZoomIn, ZoomOut, Loader2
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { auth } from '@/firebase/ClientApp';
import type { MessageAttachment } from '@/hooks/use-messages';

// Worker pdf.js servi depuis /public — autonome, aucun CDN requis
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface DocumentViewerProps {
  item: MessageAttachment | null;
  open: boolean;
  onClose: () => void;
  onDownload: (url: string, filename: string) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

/**
 * Visionneuse de documents (PDF) — rend le fichier en canvas via pdf.js :
 * fonctionne à l'identique sur desktop, mobile et WebView (Capacitor),
 * sans dépendre du viewer PDF natif du navigateur.
 */
export function DocumentViewer({ item, open, onClose, onDownload }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Token Firebase pour le proxy authentifié — on attend sa résolution
  // avant de monter <Document>, sinon le premier appel part sans Bearer (401)
  useEffect(() => {
    if (!open) return;
    setTokenReady(false);
    let cancelled = false;
    (async () => {
      try {
        await auth.authStateReady();
        const t = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        if (!cancelled) { setIdToken(t); setTokenReady(true); }
      } catch {
        if (!cancelled) { setIdToken(null); setTokenReady(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Largeur utile du conteneur → pages adaptées à l'écran
  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (!el) return;
    const update = () => setPageWidth(el.clientWidth - 32);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (open) {
      setNumPages(0);
      setScale(1);
      setLoadError(false);
    }
  }, [open, item?.url]);

  if (!item) return null;

  const proxyUrl = `/api/files/proxy?url=${encodeURIComponent(item.url)}`;
  const zoom = (delta: number) =>
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2))));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-w-5xl flex-col gap-0 overflow-hidden border-0 bg-neutral-900 p-0 sm:h-[88vh] sm:w-[96vw] [&>button]:hidden">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>

        {/* Barre d'outils — style viewer natif */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-neutral-900 px-3 sm:px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
            <FileText className="h-4 w-4 text-white/80" />
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/90" title={item.name}>
            {item.name}
          </p>
          {numPages > 0 && (
            <span className="hidden shrink-0 text-xs text-white/50 sm:block">
              {numPages} page{numPages > 1 ? 's' : ''}
            </span>
          )}
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40"
              onClick={() => zoom(-0.25)}
              disabled={scale <= MIN_SCALE}
              aria-label="Zoom arrière"
            >
              <ZoomOut className="h-[18px] w-[18px]" />
            </Button>
            <span className="hidden w-12 text-center text-xs tabular-nums text-white/60 sm:block">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40"
              onClick={() => zoom(0.25)}
              disabled={scale >= MAX_SCALE}
              aria-label="Zoom avant"
            >
              <ZoomIn className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => onDownload(item.url, item.name)}
              aria-label="Télécharger"
            >
              <Download className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>

        {/* Corps — pages PDF */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto bg-neutral-800">
          {loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <FileText className="h-10 w-10 text-white/30" />
              <p className="text-sm text-white/70">Impossible d&apos;afficher ce document.</p>
              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white/90 hover:bg-white/10 hover:text-white"
                onClick={() => onDownload(item.url, item.name)}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Télécharger le fichier
              </Button>
            </div>
          ) : !tokenReady ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              <p className="text-xs text-white/50">Chargement du document…</p>
            </div>
          ) : (
            <Document
              file={proxyUrl}
              options={{
                httpHeaders: idToken ? { Authorization: `Bearer ${idToken}` } : {},
              }}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={() => setLoadError(true)}
              loading={
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                  <p className="text-xs text-white/50">Chargement du document…</p>
                </div>
              }
            >
              <div className="flex flex-col items-center gap-4 py-4">
                {Array.from({ length: numPages }, (_, i) => (
                  <Page
                    key={i}
                    pageNumber={i + 1}
                    scale={scale}
                    width={pageWidth > 0 ? pageWidth : undefined}
                    className="shadow-lg"
                    loading={
                      <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                      </div>
                    }
                  />
                ))}
              </div>
            </Document>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
