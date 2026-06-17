## Goal
In the practice problem viewer, show the uploaded drawing (PDF or image) embedded directly in the page above the instructions, instead of a "Download" button.

## Changes

**`src/components/inventor/PracticeBrowser.tsx`** (problem detail view)
- Remove the "Drawing" download link from the action row (keep the "Reference model" download — that's still a CAD file users need locally).
- Add a new "Drawing" section between the header card and the Instructions section:
  - If `drawingUrl` ends in `.pdf` (or content-type indicates PDF): render with an `<iframe src={drawingUrl} />` (or `<object>`) at a comfortable height (~80vh, max ~900px), full width of the content column, with a rounded border matching the surrounding cards.
  - If it's an image: render as a responsive `<img>` inside the same bordered container.
  - Include a small "Open in new tab" link in the section header for users who want a full-screen view or to print.
  - If no `drawingUrl`, omit the section entirely.

**`src/routes/admin.practice.$slug.tsx`** (admin editor)
- Update the "Drawing" asset field label/help text to clarify it will be displayed inline (PDF or image recommended; PDF preferred for multi-page drawings).
- No schema changes — the existing `drawing_url` column and `practice-assets` bucket already support PDF uploads.

## Out of scope
- Custom PDF.js viewer with page controls/zoom (browser-native PDF viewer is fine for v1).
- Changing the reference model field — that stays a download.
- Backend / storage / RLS changes.