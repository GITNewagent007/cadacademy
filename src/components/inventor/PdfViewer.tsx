import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type PdfJsLib = typeof import("pdfjs-dist");
type PDFDocumentProxy = Awaited<ReturnType<PdfJsLib["getDocument"]>["promise"]>;
type RenderTask = ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;
    const renderTasks: RenderTask[] = [];
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    setError(null);
    container.innerHTML = "";

    const renderAll = async () => {
      try {
        const [pdfjsLib, workerMod] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]);
        pdfjsLib.GlobalWorkerOptions.workerSrc = (workerMod as { default: string }).default;
        const loadingTask = pdfjsLib.getDocument({ url });
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        const containerWidth = container.clientWidth || 800;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdfDoc.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const cssScale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: cssScale * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${baseViewport.width * cssScale}px`;
          canvas.style.height = `${baseViewport.height * cssScale}px`;
          canvas.className = "block mx-auto max-w-full bg-white";

          const wrapper = document.createElement("div");
          wrapper.className = "";
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          const task = page.render({ canvasContext: ctx, viewport, canvas });
          renderTasks.push(task);
          await task.promise;

          if (pageNum === 1) setLoading(false);
          await new Promise((r) => requestAnimationFrame(r));
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          console.error("PDF render failed", e);
          setError("Could not render PDF.");
          setLoading(false);
        }
      }
    };

    renderAll();

    return () => {
      cancelled = true;
      renderTasks.forEach((t) => {
        try {
          t.cancel();
        } catch {
          /* noop */
        }
      });
      if (pdfDoc) {
        try {
          (pdfDoc as unknown as { destroy?: () => Promise<void> }).destroy?.();
        } catch {
          /* noop */
        }
      }
    };
  }, [url]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-x-hidden overflow-y-auto bg-slate-100 scrollbar-hide [&::-webkit-scrollbar]:hidden"
        style={{ aspectRatio: "297 / 210", scrollbarWidth: "none", msOverflowStyle: "none" }}
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80">
          <Loader2 className="h-6 w-6 animate-spin text-blueprint" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-600">
          {error}{" "}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-blueprint hover:underline"
          >
            Open PDF ↗
          </a>
        </div>
      )}
    </div>
  );
}
