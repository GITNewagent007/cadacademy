## Goal
Keep the PDF viewer’s fixed A4 landscape aspect ratio, but remove the visible padding around the pages and hide the scrollbar.

## Changes
1. **`src/components/inventor/PdfViewer.tsx`**
   - **Scrollbar**: Add `scrollbar-hide` (or equivalent Tailwind class) to the container to hide the vertical scrollbar while keeping scroll behavior.
   - **Container padding**: Remove `p-4` from the container div so the PDF pages sit flush against the edges of the box.
   - **Page spacing**: Remove `mb-4 last:mb-0` from the per-page wrapper divs so pages stack without gaps.
   - **Aspect ratio**: Keep `style={{ aspectRatio: "297 / 210" }}` unchanged.

## Result
- The viewer retains its landscape A4 proportions.
- Pages fill the entire box edge-to-edge with no side, top, bottom, or inter-page padding.
- The scrollbar is no longer visible, but the user can still scroll through pages.