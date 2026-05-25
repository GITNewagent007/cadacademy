## Goal
Let a single linked button carry two image icons — a 32×32 for large placements and a 16×16 for small placements — so that linking a button across sizes still shows the right resolution.

## Approach
Keep one shared `RibbonButton` (so linking stays intact), but extend its icon to optionally carry a second image. The renderer picks the right one based on the button's current variant.

## Data model (`src/lib/layout-types.ts`)
Add one optional field to `RibbonButton`:
- `iconSmall?: IconRef` — used when the button renders as `small` / `split-small`. If absent, fall back to `icon`.

The existing `icon` stays the default / large icon. Lucide icons need no second slot (they scale), so this only meaningfully differs for `type: "image"` icons.

## Rendering (`src/components/inventor/Ribbon.tsx` + `IconRender`)
In `Ribbon.tsx`, where `IconRender` is used inside `SmallButton` (and `split-small` paths / dropdown rows), pass `btn.iconSmall ?? btn.icon` instead of `btn.icon`. `LargeButton` keeps using `btn.icon`. No changes needed in `IconRender` itself.

Also update any other place that renders the icon at small size (e.g. group dropdown menu rows in `Ribbon.tsx`) to use the small variant.

## Editor (`src/routes/admin.inventor.tsx`, `EditButtonPanel`)
Restructure the Icon section into two stacked slots:

```
Icon (large / 32px)        [preview] [Upload] [Lucide picker]
Small icon (16px, optional) [preview] [Upload] [Clear → use large]
```

- Large slot edits `btn.icon` (unchanged behavior, including the Lucide grid).
- Small slot edits `btn.iconSmall`. Shows a preview at 16px. Has its own "Upload image" button (uploads to the same `button-icons` bucket, sets `b.iconSmall = { type: "image", url }`). Includes a "Clear" / "Use large icon" button that deletes `iconSmall`.
- The Lucide search grid stays only on the large slot — Lucide icons scale fine, so we don't duplicate the picker.
- Add a tiny helper note: "Used automatically when this button appears in a small placement. Recommended: 16×16."

Refactor `uploadIcon` to accept which slot it targets (`"large" | "small"`) and set the correct field.

## Editor list previews
`IconRender` calls at size 14 in the column list (lines 655, 746) should also prefer `iconSmall` so the editor preview matches what users will see in small slots. Resolve once via a small helper: `iconFor(btn, variant)`.

## Out of scope
- No DB migration — `layout` is `jsonb`, the new field is additive and optional.
- No changes to linking, articles, separators, outlined/hideIcon, or theme.
- No automatic image resizing on upload; users upload the two sizes themselves as they already do.

## Files touched
- `src/lib/layout-types.ts` — add `iconSmall?: IconRef`.
- `src/components/inventor/Ribbon.tsx` — pick `iconSmall ?? icon` for small renderings.
- `src/routes/admin.inventor.tsx` — second upload slot in `EditButtonPanel`; small previews in column list use small icon.
