import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileWarning, Loader2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DocumentRow } from "@/lib/licencehub";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type ViewerKind = "pdf" | "image" | "other";

function fileKind(path: string): ViewerKind {
  const extension = path.split("?")[0]?.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension ?? "")) return "image";
  return "other";
}

export function DocumentViewerDialog({
  document,
  url,
  open,
  onOpenChange,
  onDownload,
  downloading,
}: {
  document: DocumentRow | null;
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      setViewportWidth(Math.max(0, width - 24));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    setPageNumber(1);
    setNumPages(0);
    setPdfZoom(1);
    setImageZoom(1);
  }, [document?.id]);

  if (!document) return null;

  const kind = fileKind(document.storage_path);
  const pageWidth = viewportWidth > 0 ? Math.floor(viewportWidth * pdfZoom) : undefined;
  const imageZoomClass =
    imageZoom === 2 ? "scale-200" : imageZoom === 1.5 ? "scale-150" : "scale-100";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="document-viewer-description"
        className="inset-0 top-0 left-0 grid h-dvh w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden border-0 p-0 duration-150 sm:inset-x-3 sm:top-3 sm:left-3 sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100vw-1.5rem)] sm:translate-x-0 sm:translate-y-0 sm:rounded-lg sm:border [&>button]:hidden"
      >
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <DialogTitle className="truncate text-sm sm:text-base">{document.title}</DialogTitle>
            <DialogDescription id="document-viewer-description" className="truncate text-xs">
              {document.subject} · {document.year}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              onClick={onDownload}
              disabled={downloading}
              aria-label="Télécharger le document"
            >
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              <span className="hidden sm:inline">Télécharger</span>
            </Button>
            <DialogClose asChild>
              <Button size="icon" variant="ghost" aria-label="Fermer la visionneuse">
                <X />
              </Button>
            </DialogClose>
          </div>
        </header>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-muted/50">
          {kind === "pdf" ? (
            <div className="flex min-w-0 items-center justify-center gap-1 border-b border-border bg-background px-2 py-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                disabled={pageNumber <= 1}
                aria-label="Page précédente"
              >
                <ChevronLeft />
              </Button>
              <span className="w-20 text-center text-xs tabular-nums sm:text-sm">
                {numPages ? `${pageNumber} / ${numPages}` : "— / —"}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPageNumber((page) => Math.min(numPages, page + 1))}
                disabled={!numPages || pageNumber >= numPages}
                aria-label="Page suivante"
              >
                <ChevronRight />
              </Button>
              <span className="mx-1 h-5 w-px bg-border" />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPdfZoom((zoom) => Math.max(0.75, zoom - 0.25))}
                disabled={pdfZoom <= 0.75}
                aria-label="Réduire le zoom"
              >
                <Minus />
              </Button>
              <span className="w-10 text-center text-xs tabular-nums">{Math.round(pdfZoom * 100)}%</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPdfZoom((zoom) => Math.min(2, zoom + 0.25))}
                disabled={pdfZoom >= 2}
                aria-label="Agrandir le zoom"
              >
                <Plus />
              </Button>
            </div>
          ) : kind === "image" ? (
            <div className="flex items-center justify-center gap-1 border-b border-border bg-background px-2 py-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setImageZoom((zoom) => (zoom === 2 ? 1.5 : 1))}
                disabled={imageZoom === 1}
                aria-label="Réduire le zoom"
              >
                <Minus />
              </Button>
              <span className="w-12 text-center text-xs tabular-nums">{Math.round(imageZoom * 100)}%</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setImageZoom((zoom) => (zoom === 1 ? 1.5 : 2))}
                disabled={imageZoom === 2}
                aria-label="Agrandir le zoom"
              >
                <Plus />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setImageZoom(1)}
                disabled={imageZoom === 1}
                aria-label="Réinitialiser le zoom"
              >
                <RotateCcw />
              </Button>
            </div>
          ) : (
            <div />
          )}

          <div ref={viewportRef} className="min-h-0 min-w-0 overflow-auto overscroll-contain">
            {!url ? (
              <div className="grid h-full place-items-center">
                <Loader2 className="size-7 animate-spin text-muted-foreground" />
              </div>
            ) : kind === "pdf" ? (
              <Document
                file={url}
                onLoadSuccess={({ numPages: total }) => {
                  setNumPages(total);
                  setPageNumber((page) => Math.min(page, total));
                }}
                loading={
                  <div className="grid h-full place-items-center py-16">
                    <Loader2 className="size-7 animate-spin text-muted-foreground" />
                  </div>
                }
                error={
                  <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
                    Impossible d’afficher ce PDF. Vous pouvez toujours le télécharger.
                  </div>
                }
                className="flex min-h-full justify-center p-3"
              >
                <Page pageNumber={pageNumber} {...(pageWidth ? { width: pageWidth } : {})} />
              </Document>
            ) : kind === "image" ? (
              <div className="flex min-h-full min-w-full items-start justify-center p-2 sm:p-4">
                <img
                  src={url}
                  alt={document.title}
                  className={`block h-auto max-w-full origin-top object-contain transition-transform ${imageZoomClass}`}
                  onDoubleClick={() => setImageZoom((zoom) => (zoom === 1 ? 2 : 1))}
                />
              </div>
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <div>
                  <FileWarning className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-4 font-semibold">Aperçu indisponible pour ce format</p>
                  <p className="mt-1 text-sm text-muted-foreground">Téléchargez le fichier pour le consulter.</p>
                  <Button className="mt-5" onClick={onDownload} disabled={downloading}>
                    {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                    Télécharger
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}