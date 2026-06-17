import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const renderPage = async (pageNum: number) => {
    const pdfDoc = pdfDocRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!pdfDoc || !container || !canvas) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        /* noop */
      }
      renderTaskRef.current = null;
    }

    try {
      setLoading(true);
      setError(null);
      const page = await pdfDoc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });

      const containerWidth = container.clientWidth || 800;
      const containerHeight =
        container.clientHeight || containerWidth * (297 / 210);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const scaleX = containerWidth / baseViewport.width;
      const scaleY = containerHeight / baseViewport.height;
      const cssScale = Math.min(scaleX, scaleY);

      const viewport = page.getViewport({ scale: cssScale * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${baseViewport.width * cssScale}px`;
      canvas.style.height = `${baseViewport.height * cssScale}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
      setLoading(false);
    } catch (e) {
      if ((e as Error)?.message?.includes("cancelled")) return;
      console.error("Page render failed", e);
      setError("Could not render page.");
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        setNumPages(0);

        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        if (cancelled) {
          try {
            (
              pdf as unknown as { destroy?: () => Promise<void> }
            ).destroy?.();
          } catch {
            /* noop */
          }
          return;
        }
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        await renderPage(1);
      } catch (e) {
        if (!cancelled) {
          console.error("PDF load failed", e);
          setError("Could not load PDF.");
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          /* noop */
        }
      }
      if (pdfDocRef.current) {
        try {
          (
            pdfDocRef.current as unknown as { destroy?: () => Promise<void> }
          ).destroy?.();
        } catch {
          /* noop */
        }
        pdfDocRef.current = null;
      }
    };
  }, [url]);

  useEffect(() => {
    if (numPages === 0) return;
    renderPage(currentPage);
  }, [currentPage]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));

  return (
    <div>
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-slate-100 mx-auto flex items-center justify-center"
        style={{ aspectRatio: "210 / 297", maxWidth: "100%" }}
      >
        <canvas ref={canvasRef} className="block max-w-full max-h-full" />
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80">
            <Loader2 className="h-6 w-6 animate-spin text-blueprint" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-slate-600">
            <span>{error}</span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-blueprint hover:underline"
            >
              Open PDF ↗
            </a>
          </div>
        )}
      </div>

      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={goPrev}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-600 font-medium">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={goNext}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
