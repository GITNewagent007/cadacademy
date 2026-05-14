
## Goal

Let admins upload a Microsoft Word (`.docx`) file for an article. The uploaded document becomes the source of truth — the on-site block editor is hidden for these articles, and visitors see the rendered document directly. Re-uploading replaces the content.

## User flow

1. Admin opens `/admin/articles/<slug>`.
2. Instead of the block/document editor, they see an **Upload Word document** panel showing:
   - Current uploaded file name + uploaded date (if any)
   - Drop zone / file picker (`.docx` only)
   - "Replace document" and "Remove document" buttons
3. On upload, the file is converted to clean HTML on the server, images are extracted and stored, and the article is saved.
4. Public `/articles/<slug>` page renders the converted HTML in a styled "document" container.
5. Title / summary / slug fields stay editable on the admin page (metadata only).

## What changes

### Database (migration)
Add to `articles`:
- `source_kind text not null default 'blocks'` — `'blocks'` or `'docx'`
- `html text not null default ''` — rendered HTML for `docx` articles
- `source_file_path text` — storage path of the original `.docx` (for re-download / reference)
- `source_file_name text`
- `source_uploaded_at timestamptz`

The existing `content jsonb` column stays for legacy block-based articles.

### Storage
New public bucket `article-assets` for:
- Original `.docx` files: `articles/<articleId>/source.docx`
- Extracted images: `articles/<articleId>/images/<hash>.<ext>`

RLS: public read; admin-only write (mirrors existing pattern).

### Server function — `uploadArticleDocx`
Protected by `requireSupabaseAuth` + admin role check.
- Input: `articleId`, base64 file
- Uses **`mammoth`** (pure JS, Worker-compatible) to convert `.docx` → HTML, with a custom image handler that uploads each embedded image to the `article-assets` bucket and rewrites `<img src>` to the public URL.
- Sanitizes HTML (allowlist tags: headings, p, ul/ol/li, table/tr/td/th, img, a, strong/em/code, pre, blockquote, hr).
- Stores original `.docx` to storage.
- Updates `articles` row: `source_kind='docx'`, `html=...`, file metadata.

### Admin UI (`src/routes/admin.articles.$slug.tsx`)
- Detect `source_kind`. If `docx` (or article is empty), show the new `DocxUploader` panel as the primary editor.
- Provide a "Switch to block editor" escape hatch (sets `source_kind='blocks'`, keeps file metadata for reference).
- Remove the heavy TipTap editor from the docx path — title / summary / slug remain.

### Public renderer (`src/components/articles/ArticleRenderer.tsx` + route)
- If `source_kind === 'docx'`: render `<div class="prose-doc" dangerouslySetInnerHTML={{ __html: article.html }} />`.
- Else: existing block renderer.
- Add print/document styling (already partly present in `prose-doc` from earlier work) to handle Word's tables, lists, and images cleanly.

## Technical details

- **Library**: `mammoth` (~150KB, pure JS, no native deps — runs fine in the Cloudflare Worker runtime).
- **Image handling**: mammoth's `convertImage` callback yields a buffer + content-type per embedded image; we hash → upload to `article-assets` → return the public URL.
- **Sanitization**: small allowlist sanitizer (no external dep needed; or `sanitize-html` if it bundles cleanly — verify before adding).
- **Size limit**: reject files >10MB at the server function boundary.
- **No Google Docs** in this plan, per your answer. Easy to add later by reusing the same `html` column and converting via the Google Docs export endpoint.

## Out of scope
- Editing the document on-site (re-upload to update).
- `.doc` (legacy binary) support — only `.docx`.
- Real-time collaborative editing.
- Tracked changes / comments rendering.

## Files touched
- New SQL migration (articles columns + storage bucket + policies)
- New: `src/lib/articles.functions.ts` (`uploadArticleDocx`, `removeArticleDocx`)
- New: `src/components/articles/DocxUploader.tsx`
- Edit: `src/routes/admin.articles.$slug.tsx` (branch on `source_kind`)
- Edit: `src/components/articles/ArticleRenderer.tsx` (render HTML branch)
- Edit: `src/lib/article-types.ts` (add new fields)
- Edit: `src/styles.css` (extend `.prose-doc` for Word-style output)
- `package.json`: add `mammoth`
