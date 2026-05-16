## Goal

Article images currently default to 100% of the column with a free 10–100% slider. Because original image dimensions vary and `width: 100%` has no max, the same setting looks tiny on one page and giant on another. We'll switch to **typography-relative presets** (em-based) with a **hard pixel cap**, applied to both block-based and DOCX articles.

## Sizing model

| Preset | Max width | Use for |
|--------|-----------|---------|
| Small  | 12em (~192px) | Icons, inline toolbar refs |
| Medium | 24em (~384px) | Most diagrams |
| Large  | 40em (~640px) | Hero / detailed screenshots |
| Full   | 100% of column | Edge-to-edge banners |

- All non-Full sizes use `max-width: Xem` so they scale with the article font-size and never exceed the cap.
- `width: 100%` still allowed inside that cap so smaller source images don't get upscaled past their natural size (`width: auto; max-width: min(Xem, 100%)`).
- A separate global ceiling (`max-width: 40em` for any image except Full) prevents legacy `widthPct` values from blowing up.

## Data model (`src/lib/article-types.ts`)

Add an optional `size` field to the image block; keep `widthPct` for backwards compat:

```ts
size?: "sm" | "md" | "lg" | "full"; // new — preferred
widthPct?: number;                  // legacy — still honored, but capped
```

`newBlock("image")` defaults to `size: "md"`.

For DOCX, add an analogous override map `imageSizes: Record<hash, "sm"|"md"|"lg"|"full">` alongside the existing `imageOverrides` (align). `applyImageOverrides` is extended to also stamp `data-size="md"` on the `<img>`.

## Renderer changes

**`ArticleRenderer.tsx` (block path)** — replace the `figStyle` % calc with a class lookup:
- `size === "sm" → max-w-[12em]`, `md → max-w-[24em]`, `lg → max-w-[40em]`, `full → w-full`.
- If `size` is missing but `widthPct` is set, map: `<=30 → sm`, `<=55 → md`, `<=85 → lg`, else `full`. This makes existing articles look consistent immediately without a migration.

**`src/styles.css` (DOCX path)** — add rules for `.prose-doc img`:
```css
.prose-doc img { max-width: min(40em, 100%); height: auto; }
.prose-doc img[data-size="sm"]   { max-width: min(12em, 100%); }
.prose-doc img[data-size="md"]   { max-width: min(24em, 100%); }
.prose-doc img[data-size="lg"]   { max-width: min(40em, 100%); }
.prose-doc img[data-size="full"] { max-width: 100%; width: 100%; }
```
The existing `image-extension.ts` `renderHTML` is updated so when a TipTap image has a `size` attribute it emits `data-size` and drops the inline `width: X%` style; when only `widthPct` is present it keeps today's behavior but adds `max-width: min(40em, 100%)` to the inline style. New `size` attribute is added to the extension's `addAttributes`.

## Editor UI

**`BlockListEditor.tsx`** — replace the width slider+number with a 4-button preset group (S / M / L / Full). Show the slider only behind an "Advanced (custom %)" disclosure so admins can still nudge legacy values; new % values are also capped at 40em via the renderer.

**`ImagePopover.tsx`** (DOCX TipTap popover) — same 4-button preset group, written via `updateAttributes("image", { size })`. Custom % retained behind the same disclosure.

## Files touched

- `src/lib/article-types.ts` — add `size` to image block, `imageSizes` map, helper to map legacy widthPct → preset, extend `applyImageOverrides`.
- `src/components/articles/ArticleRenderer.tsx` — preset-based class for image figures.
- `src/components/articles/image-extension.ts` — add `size` attribute + emit `data-size`, cap legacy widthPct.
- `src/components/articles/ImagePopover.tsx` — preset buttons.
- `src/components/articles/BlockListEditor.tsx` — preset buttons + advanced % disclosure.
- `src/styles.css` — `.prose-doc img[data-size=…]` rules + global cap.

No DB schema change required (the new `size` field is optional inside the existing JSONB `content`; DOCX sizes live alongside `image_overrides` as a separate JSONB column only if you want it persisted across editor sessions — see open question).

## Open question (will confirm during implementation)

For DOCX articles, store per-image size in a new `articles.image_sizes` JSONB column (mirroring `image_overrides`), or piggyback on the existing `image_overrides` map by widening its value type? Recommendation: **new column** to keep align and size cleanly separable; this is a single additive migration.
