
# CAD Teaching Platform — v1 Plan

A marketing landing page plus an interactive "learn-by-clicking" simulator that mimics Autodesk Inventor's UI. v1 covers the Model tab only, with placeholder guide content you'll author later.

## 1. Landing page (`/`)

Engineering/industrial vibe — clean white + technical blue, blueprint grid accents, monospace numerals, thin rules.

Sections:
- **Hero** — Headline ("Learn Inventor by clicking it"), subhead, primary CTA → `/learn/inventor`, secondary CTA → "How it works". Subtle blueprint grid background.
- **How it works** — 3 steps with icons (Pick a tool → Read the guide → Practice in Inventor).
- **What's covered** — Card grid showing the Model tab feature groups (Sketch, Create, Modify, Work Features, Pattern, Surface). "More programs coming soon" tag for Fusion/SolidWorks placeholders.
- **Why this exists** — Short pitch block.
- **Footer** — minimal, copyright, nav links.

## 2. The simulator (`/learn/inventor`)

Pixel-faithful recreation of the screenshot you provided. Three regions:

```
┌─────────────────────────────────────────────────────┐
│  RIBBON  (tabs + grouped buttons w/ icons + labels) │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  FEATURE     │   VIEWPORT                           │
│  TREE        │   (blue when idle, shows guide       │
│  (left)      │    panel when a button is clicked)   │
│              │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Ribbon
- Tab strip on top (File, 3D Model active, Sketch, Annotate, Inspect, Tools, Manage, View, Environments, Get Started — only "3D Model" is functional in v1, others are visually present but disabled/greyed).
- Grouped buttons matching screenshot exactly: **Sketch** (Start 2D Sketch), **Create** (Extrude, Revolve, Sweep, Loft, Coil, Emboss, Derive, Rib, Decal, Import, Unwrap), **Modify** (Hole, Fillet, Chamfer, Shell, Draft, Combine, Thicken/Offset, Split, Direct, Delete Face), **Explore** (Mark, Finish), **Work Features** (Plane, Axis, Point, UCS), **Pattern** (Rectangular, Circular, Mirror, Sketch Driven), **Create Freeform** (Box, Plane, Convert), **Surface** (Stitch, Patch, Sculpt, Ruled Surface, Trim, Extend, Replace Face, Repair Bodies, Fit Mesh Face), **Simulation** (Stress Analysis), **Convert** (Convert to Sheet Metal).
- Buttons use lucide icons styled to look like Inventor's small/large icon mix; group separators as vertical rules with group label below.
- Hover = light blue highlight; active = darker blue border. Tooltips on hover.

### Viewport
- Default: solid Inventor-blue background with the small XYZ axis triad in the bottom-left corner.
- When a button is clicked: a guide panel slides in (semi-opaque white card over the blue) showing the placeholder guide for that feature. A close (×) button returns to the empty viewport.

### Feature tree (left panel)
- Default state: shows `Part1`, `Model States: [Primary]`, `View: [Primary]`, `Origin`, `Sketch1`, `End of Part` — exactly like the screenshot — collapsible items with chevrons.
- When a guide is open: the tree's content swaps to that guide's **module list** (e.g. "1. Overview", "2. Inputs", "3. Practice", "4. Common pitfalls"). Clicking a module loads its content into the viewport panel. Active module highlighted.
- A small "Back to part tree" link at the top when in guide mode.

### Guide content (placeholders)
Every feature has the same placeholder structure so you can fill in real content later:
- Title + short description (lorem-ish placeholder)
- 3–4 modules, each with: heading, placeholder paragraph, image slot (grey box "Image placeholder"), optional video slot (grey box "Video placeholder").
- "Mark as complete" button (visual only, no persistence in v1).

### Data shape
A single typed `inventorGuides.ts` file:
```ts
type Guide = {
  id: string; label: string; group: string; icon: LucideIcon;
  description: string;
  modules: { id: string; title: string; body: string }[];
};
```
Every ribbon button maps to an entry; placeholder modules pre-filled. Easy to edit later.

## 3. Routes & files

```
src/routes/
  index.tsx                 # landing
  learn.inventor.tsx        # simulator shell (ribbon + tree + viewport)
src/components/inventor/
  Ribbon.tsx
  RibbonGroup.tsx
  RibbonButton.tsx
  FeatureTree.tsx           # renders default tree OR guide modules
  Viewport.tsx              # blue canvas + axis triad + guide panel slot
  GuidePanel.tsx            # renders selected module
src/data/inventorGuides.ts  # all placeholder content
src/components/landing/     # Hero, HowItWorks, Coverage, Footer
```

State management: a small Zustand store (or React context) for the simulator: `activeGuideId`, `activeModuleId`, setters. No backend.

## 4. Design tokens (added to `src/styles.css`)

New semantic tokens for the Inventor look (defined in oklch, exposed via `@theme inline`):
- `--inventor-viewport` (the signature blue)
- `--inventor-ribbon-bg`, `--inventor-ribbon-border`
- `--inventor-button-hover`, `--inventor-button-active`
- `--inventor-tree-bg`
- `--blueprint-grid` (used on landing hero)

Landing palette: existing neutral light theme + a technical blue accent and a blueprint cyan. Inter for body, JetBrains Mono for numerals/labels in the ribbon to evoke the Inventor UI font.

## 5. SEO / metadata
- `/` — title "Learn Autodesk Inventor by clicking — CAD Academy", description focused on interactive learning.
- `/learn/inventor` — title "Inventor simulator — interactive Model tab guide".
- Each route gets its own `head()` per project conventions.

## 6. Out of scope for v1 (noted for later)
- Real guide authoring UI / Lovable Cloud
- Auth + progress persistence
- Other tabs (Sketch, Annotate, etc.) — buttons visible, disabled
- Other CAD programs (Fusion, SolidWorks) — teased on landing only
- Real interactive dialogs that mimic Extrude/Fillet etc.

## Technical notes
- TanStack Start file-based routing; each route has its own `head()`.
- All colors via semantic tokens — no hex in components.
- Ribbon is virtualized only if needed (it isn't — ~50 buttons total).
- Tree component reuses shadcn collapsible primitives; not the shadcn Sidebar (we want a fixed Inventor-style panel, not a collapsing app sidebar).
