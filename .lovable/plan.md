## Goal

Render article text immediately. Show a pulsing skeleton in place of each image, sized so that when the image swaps in there is zero layout shift.

## Approach

Reserving the exact pixel size up-front requires knowing each image's intrinsic dimensions before it paints. We get them by preloading via `new Image()` and reading `naturalWidth` / `naturalHeight`. Once known, the skeleton box is sized using CSS `aspect-ratio` combined with the existing width rule (block image presets `sm/md/lg/full`, or the docx `data-size` / inline `width` styles). When the real `<img>` then renders it is already in the browser cache and paints into the same box instantly.

Drop the current full-article gate (`useArticleImagesReady` + the big `ArticleSkeleton` overlay). Text and non-image blocks render right away.

## Pieces

1. **`src/hooks/useImageDimensions.ts`** (new)
   - Accepts a list of URLs, returns a `Map<url, { w, h } | "error" | "loading">`.
   - Preloads via `new Image()`, captures `naturalWidth/Height` on `load`, marks `"error"` on failure. Stable across re-renders via a module-level cache so a second open of the same article is instant.

2. **Block image path (`ArticleRenderer.tsx`, `case "image"`)**
   - Look up the URL's dimensions from the hook.
   - Wrap the figure's image slot in a div with the existing width class (`max-w-[12em]` / `24em` / `40em` / `w-full`) plus `style={{ aspectRatio: w / h }}` when known.
   - Render `<Skeleton className="absolute inset-0" />` until loaded, then the `<img>` with `onLoad` flipping the local "shown" flag (or simply rely on browser cache so it paints synchronously).
   - When dimensions are unknown (still preloading), fall back to a small min-height placeholder so the skeleton is visible but does not claim a wrong size — we only commit to a fixed aspect ratio once we know it.

3. **Docx HTML path**
   - Cannot embed React inside `dangerouslySetInnerHTML`, so post-process in an effect:
     - After mount, query `.prose-doc img` and for each one with a known dimension from the hook, set `style.aspectRatio = w/h`, add a `data-skeleton` attribute, and remove it on `img.onload` / `img.complete`.
   - Add CSS in `src/styles.css` for `.prose-doc img[data-skeleton]` that paints the same pulsing `bg-primary/10` background and hides the broken-image glyph (`color: transparent`) until the attribute is removed. This matches the Skeleton component visually.
   - Width is already set by the existing `data-size` / inline-style rules in `image-extension.ts`, so combined with `aspect-ratio` the box is correctly sized before the bytes arrive.

4. **Remove obsolete code**
   - Delete `src/hooks/useArticleImagesReady.ts`.
   - Remove the `relative` wrapper, `ArticleSkeleton`, and `visibility: hidden` gating added in the previous change.

## Edge cases

- **Image with no intrinsic ratio known yet** (first ever load, not in cache): we keep a tiny `min-h-[2em]` skeleton until the preload resolves, then snap to the real ratio and paint. The image still hasn't downloaded into the actual `<img>` element at this point, but since the preloader populated the browser cache the swap is instant. This means a single brief height adjustment is possible the very first time an article is viewed; subsequent visits are shift-free because the dimensions cache persists for the session.
- **Image fails to load**: skeleton is replaced by the existing "no image URL" style fallback (or the broken `<img>` for docx).
- **Image overrides**: docx overrides only change alignment classes, not URLs, so the preload URL list is just the raw `<img src>` values.

## Out of scope

- Persisting natural dimensions in the database (would make first-load also shift-free but requires a schema change and a backfill).
