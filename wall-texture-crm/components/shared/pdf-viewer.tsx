"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Renders a PDF blob page-by-page onto canvases, fitted to the container width.
 * Used instead of <iframe>/<embed> because mobile browsers don't render inline
 * PDFs reliably — this behaves the same on desktop, tablet and phone.
 */
export function PdfViewer({ blob, className }: { blob: Blob | undefined; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pageCount, setPageCount] = useState(0);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.floor(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Parse the document once per blob.
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  useEffect(() => {
    if (!blob) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const data = new Uint8Array(await blob.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current?.destroy();
        docRef.current = doc;
        setPageCount(doc.numPages);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  // (Re)draw whenever the document or the available width changes.
  useEffect(() => {
    const doc = docRef.current;
    if (status !== "ready" || !doc || width <= 0) return;
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const cssScale = width / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: cssScale * dpr });
        const canvas = canvasRefs.current[i - 1];
        if (!canvas) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, width, pageCount]);

  useEffect(
    () => () => {
      docRef.current?.destroy();
      docRef.current = null;
    },
    [],
  );

  return (
    <div ref={containerRef} className={className}>
      {(status === "loading" || status === "idle") && (
        <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Rendering quotation…
        </div>
      )}
      {status === "error" && (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5" /> Could not display the PDF. Try Download instead.
        </div>
      )}
      <div className="space-y-4">
        {Array.from({ length: pageCount }).map((_, i) => (
          <canvas
            key={i}
            ref={(el) => {
              canvasRefs.current[i] = el;
            }}
            className="block max-w-full bg-white shadow-md ring-1 ring-black/5"
          />
        ))}
      </div>
    </div>
  );
}
