"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import type { MessageAttachment } from '@/hooks/use-messages';

interface DriverMediaViewerProps {
  items: MessageAttachment[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  onDownload: (url: string, filename: string) => void;
}

export function DriverMediaViewer({ items, initialIndex, open, onClose, onDownload }: DriverMediaViewerProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex(i => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items.length]);

  const item = items[index];
  if (!item) return null;
  // `type` peut être un MIME (video/mp4) ou une extension (MP4)
  const ext = (item.type && !item.type.includes('/') ? item.type : item.name?.split('.').pop() || '').toLowerCase();
  const isVideo = item.type?.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'].includes(ext);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-w-5xl flex-col gap-0 border-0 bg-black/95 p-0 sm:h-[86vh] sm:w-[96vw] [&>button]:hidden">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Barre supérieure */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
            <span className="text-sm font-medium text-white/80">
              {items.length > 1 ? `${index + 1} / ${items.length}` : item.name}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => onDownload(item.url, item.name)}
                aria-label="Télécharger"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={onClose}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Média */}
          <div className="flex flex-1 items-center justify-center overflow-hidden p-4 pt-12">
            {isVideo ? (
              <video
                key={item.url}
                src={item.url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-lg"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.url}
                src={item.url}
                alt={item.name}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            )}
          </div>

          {/* Navigation */}
          {items.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30"
                onClick={() => setIndex(i => i - 1)}
                disabled={index === 0}
                aria-label="Média précédent"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30"
                onClick={() => setIndex(i => i + 1)}
                disabled={index === items.length - 1}
                aria-label="Média suivant"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
