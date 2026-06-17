## Goal

Make the inline drawing viewer feel faster and cleaner. Today it embeds the PDF in a native `<iframe>`, which loads the full browser PDF UI (toolbar, sidebar, search) and re-runs that work on every navigation — that's what's causing the visible lag and the busy header.

## Approach

Replace the iframe with a lightweight pdf.js-based renderer that draws each page as a canvas inside a simple scroll container — no toolbar, no sidebar, just the pages.

### 1. Add pdf.js

- Install `pdfjs-dist` via bun.
- Load the worker from the same package using Vite's `?url` import so it's bundled, not fetched from a CDN.

### 2. New component `src/components/inventor/PdfViewer.tsx`

- Props: `{ url: string }`.
- On mount: `pdfjsLib.getDocument(url)` → for each page, render to a `<canvas>` sized to the container width (devicePixelRatio-aware for crisp output).
- Render pages progressively (page 1 first, then the rest) so the first page appears fast even on heavy PDFs.
- Container: vertical scroll, `height: min(80vh, 900px)`, light slate background, page canvases stacked with a small gap and subtle shadow.
- States: skeleton/spinner while the doc loads; inline error fallback with a link to open the PDF directly if rendering fails.
- Re-render on container resize (ResizeObserver, debounced) so pages stay sharp when the layout changes.
- Cleanup: destroy the pdf document and cancel in-flight render tasks on unmount / url change.

### 3. Wire into `PracticeBrowser.tsx` `DrawingViewer`

- PDF branch → `<PdfViewer url={url} />` (drop the iframe).
- Image branch unchanged.
- Unknown type → keep a minimal iframe fallback.
- Header: keep the "Drawing" title, change the link label to **"Open in new tab for more fidelity ↗"**.

### Out of scope

- No zoom / page-jump / search controls in-app (that's the "open in new tab" path).
- No changes to upload flow, storage, or admin UI.
- No changes to the image viewer or reference-model download.

### Technical notes

- pdf.js worker setup:
  ```ts
  import * as pdfjsLib from "pdfjs-dist";
  import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  ```
- Render scale = `(containerWidth / viewport.width) * devicePixelRatio`, capped (e.g. ≤ 2) to keep big PDFs from blowing up memory.
- Use `requestAnimationFrame` between page renders so the UI stays responsive while a long PDF paints.
