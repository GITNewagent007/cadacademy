## What's already there

The route `/admin/articles/$slug` already renders an editor with:
- Title + summary inputs
- A block list editor supporting all 9 block types you listed (heading, paragraph, list, image, video, table, callout, code, divider)
- Inline `**bold**`, `*italic*`, `` `code` ``, `[link](url)` parsing in text fields
- Preview toggle + Save

So "I can only create, not edit" is almost certainly because:
- The URL `/admin/articles/asd` points at a slug that doesn't exist → you see the "Article not found" screen.
- Or the article list page doesn't make it obvious that clicking a row opens the editor.

## Plan

### 1. Fix discoverability + any blockers (small)
- On `/admin/articles`, make each row a clearly-styled "Edit" link (button + chevron) instead of just a title.
- Add a visible "Open editor" button next to each article.
- After "Create", auto-navigate to the new editor (verify this still works) and toast "Article created — start editing below".
- If the slug in the URL doesn't resolve, show a clear "No article with slug X — back to list" (already there, just polish).

### 2. Make the editor feel like a real editor
- **Per-block insert** — show a thin "+ Add block here" affordance between blocks (not only at the bottom), so writers can insert a heading mid-article.
- **Inline formatting toolbar** for paragraph / callout / list-item / table-cell textareas: B / I / Code / Link buttons that wrap the current selection in the existing inline markdown syntax. Keeps the data model unchanged.
- **Link helper** — small popover that prompts for text + URL and inserts `[text](url)` at the caret.
- **Drag-to-reorder** blocks (in addition to the existing up/down arrows), using `@dnd-kit/sortable` (already a common dep; add if missing).
- **Keyboard**: Enter on an empty paragraph adds a new paragraph below; Cmd/Ctrl+S saves; Cmd/Ctrl+B/I/K wrap selection.
- **Auto-grow** textareas instead of fixed 3-row height.
- **Unsaved-changes guard** — disable Save when nothing changed; warn on navigation when dirty.

### 3. Richer block features
- **Image block**: add an "Upload" button that uploads to the existing `button-icons` Supabase Storage bucket (or a new `article-media` bucket — see Open Question) and fills the URL field.
- **Video block**: show live preview (YouTube/Vimeo iframe / `<video>`) inside the editor card so the author sees what they're embedding.
- **Table**: add "+ Row above/below", "+ Col left/right", and per-row/col delete; current UI only appends.
- **Callout**: visual variant preview (icon + color) inside the editor card so it matches the rendered look.
- **Code**: monospace textarea + a simple language dropdown (plain, ts, js, sql, bash, json) — no syntax highlighting yet, just a label rendered above the block.
- **Divider**: already fine.

### 4. Save & feedback
- Save button shows last-saved timestamp ("Saved 2s ago").
- Toast on save error includes the Supabase message (already there) plus a hint if it's an RLS failure ("You need admin access").
- Verify admin RLS on `articles` actually lets the current user update — confirm by reading current user's `user_roles` and surfacing a red banner in the editor header if not admin.

### 5. Out of scope (for now)
- Real rich-text WYSIWYG (TipTap/ProseMirror) — keeping the markdown-flavored block model so content stays clean JSON and easy to render anywhere.
- Versioning / drafts — single live row per article.
- Media library browser.

## Technical notes

- New deps: `@dnd-kit/core` + `@dnd-kit/sortable` for drag reorder (only if not already installed).
- New Storage bucket `article-media` (public read, admin write) if we want a separate namespace for article images. Otherwise reuse `button-icons`.
- All block shapes in `src/lib/article-types.ts` stay the same — additions are purely editor UX. Renderer untouched (already handles every block type cleanly).
- New components:
  - `src/components/articles/InlineToolbar.tsx` — selection-aware B/I/Code/Link buttons.
  - `src/components/articles/AutoTextarea.tsx` — auto-grow textarea wrapper.
  - `src/components/articles/SortableBlock.tsx` — dnd-kit wrapper around each block card.
- `BlockListEditor.tsx` rewritten to wrap items in `SortableContext` and render the per-block insert bar between items.
- `admin.articles.$slug.tsx` gets dirty-tracking + keyboard shortcuts + last-saved label.

## Open questions

1. Image upload target — reuse the existing `button-icons` bucket, or create a new `article-media` bucket?
2. Drag-reorder via dnd-kit OK, or keep just up/down arrows to avoid the dep?
