
## Goal

Replace the single `/learn/inventor` page (which drives everything from local state + `?tab=&article=` query params) with a nested route tree so every meaningful view has its own shareable URL and the browser back/forward buttons navigate between them.

## URL structure

```
/learn/inventor                                → redirect to /learn/inventor/part1
/learn/inventor/part1                          → Part environment, default tab
/learn/inventor/part1/$tabId                   → Part env with a ribbon tab active (e.g. /part1/3d-model)
/learn/inventor/part1/$tabId/$buttonId         → Same, with the tool's article overlay open (e.g. /part1/3d-model/extrude)

/learn/inventor/articles                       → Article library (list only, no selection)
/learn/inventor/articles/$slug                 → Article library with that article open (e.g. /articles/boolean-operations)

/learn/inventor/tutorials                      → Tutorials landing (redirects to /tutorials/practice-problems)
/learn/inventor/tutorials/practice-problems              → Practice problem library
/learn/inventor/tutorials/practice-problems/$slug        → Single practice problem (e.g. /machinists-vice)
/learn/inventor/tutorials/library                        → Tutorial library (grid of tutorials)
/learn/inventor/tutorials/library/$tutorialSlug          → Tutorial, first module selected
/learn/inventor/tutorials/library/$tutorialSlug/$moduleSlug  → Specific module
```

The "Learning Paths" sidebar (Practice Problems / Tutorials / Video Tutorials / First Part Course) becomes real links to these routes instead of local state.

The FileTabs bar (Part1 / Tutorials / Articles) at the bottom becomes real links to `/part1`, `/tutorials`, `/articles`; the active tab is derived from the URL.

## Route files to create

All under `src/routes/`, using TanStack's dot-separated file naming:

- `learn.inventor.tsx` — becomes a **layout route** that renders the chrome (top bar + `<FileTabs>` bar reading active from URL) and an `<Outlet />`. `InventorSimProvider` moves here so all children share it.
- `learn.inventor.index.tsx` — redirects to `/learn/inventor/part1`.
- `learn.inventor.part1.tsx` — layout for the Part environment. Renders `<Ribbon />`, `<FeatureTree />`, `<Viewport />`, and reads `$tabId`/`$buttonId` from child match to drive `InventorSimProvider` state.
- `learn.inventor.part1.index.tsx` — redirects to the default tab (first enabled tab in the layout, currently `model`).
- `learn.inventor.part1.$tabId.tsx` — sets the active tab from the URL.
- `learn.inventor.part1.$tabId.$buttonId.tsx` — additionally opens the button's article.
- `learn.inventor.articles.tsx` — Article library layout (search + list). Renders `<Outlet />` for the reader pane.
- `learn.inventor.articles.index.tsx` — empty reader ("Select an article to read.").
- `learn.inventor.articles.$slug.tsx` — fetches by slug and renders the article; sets `head()` per article for shareable previews.
- `learn.inventor.tutorials.tsx` — Tutorials layout: renders the Learning Paths sidebar + `<Outlet />`.
- `learn.inventor.tutorials.index.tsx` — redirects to `/tutorials/practice-problems`.
- `learn.inventor.tutorials.practice-problems.tsx` — layout with practice list + `<Outlet />`.
- `learn.inventor.tutorials.practice-problems.index.tsx` — empty right-pane state.
- `learn.inventor.tutorials.practice-problems.$slug.tsx` — practice problem detail.
- `learn.inventor.tutorials.library.tsx` — tutorial library layout + `<Outlet />`.
- `learn.inventor.tutorials.library.index.tsx` — tutorial grid.
- `learn.inventor.tutorials.library.$tutorialSlug.tsx` — tutorial view with module rail; child `<Outlet />` renders the module.
- `learn.inventor.tutorials.library.$tutorialSlug.index.tsx` — redirects to the first module's slug.
- `learn.inventor.tutorials.library.$tutorialSlug.$moduleSlug.tsx` — module reader.

## Component refactor

- **`TutorialsView`**: split. The Learning Paths sidebar becomes a small `<LearningPathsSidebar>` component whose items are `<Link>`s using `activeProps` (or `useRouterState`) to highlight the active path. The old inner state (`activeId`, `practiceSlug`, `selectedSlug`) is deleted.
- **`ArticlesBrowser`**: split into `<ArticleList>` (left pane, uses `<Link to="/learn/inventor/articles/$slug" params>`) and `<ArticleReader>` (right pane, reads slug from `useParams`). Selection state comes from the URL.
- **`PracticeBrowser`**: same split — `<PracticeList>` and existing `<PracticeDetail>`; list items become links; the "back" button navigates to `..`.
- **`TutorialsBrowser`**: replaced by three route components (list, tutorial view, module reader). The existing `TutorialView` and `ModuleReader` are reused but read `tutorialSlug` / `moduleSlug` from route params; module rail entries become `<Link>`s.
- **`Ribbon`/`FeatureTree`/`Viewport`**: unchanged internals, but the button-click handler switches from `sim.open(buttonId)` to `navigate({ to: '/learn/inventor/part1/$tabId/$buttonId', params })`; tab-click switches to navigating to `/part1/$tabId`. The store keeps its API so overlay rendering doesn't change, but the URL is the source of truth — a small `<SyncSimFromParams>` component (equivalent to today's `ApplySearchParams` but reacts on every param change) sets `activeTabId`, `activeButtonId`, and `activeArticleId` whenever the URL changes.
- Overlay "close" navigates from `/part1/$tabId/$buttonId` back to `/part1/$tabId`.

## Data & backward compatibility

- No database schema changes. `articles.slug`, `practice_problems.slug`, `tutorials.slug`, and `tutorial_modules.slug` already exist and are unique per program.
- The current `?tab=&article=` search-param entry point stays supported for one release: the `learn.inventor.index` redirect preserves those params by mapping them to the new path where possible, so any existing shared links keep working.
- Button IDs from the layout are already URL-safe slugs (kebab-case) — used directly as the `$buttonId` segment. If a legacy button id contains characters that need encoding, we `encodeURIComponent` at link time; navigation still resolves.

## SEO / head metadata

Each leaf route sets its own `head()`:
- `articles.$slug` → article title + summary, `og:title`, `og:description`, `og:image` when the article has a hero image.
- `practice-problems.$slug` → problem name + summary, `og:image` from `thumbnailUrl`.
- `library.$tutorialSlug` and `.$moduleSlug` → tutorial/module title + summary.
- Part-env routes keep the current shared head (no unique image per tool).

## Out of scope

- No changes to admin routes.
- No changes to the landing page (`/`).
- No visual redesign — only URLs, navigation wiring, and the split of `TutorialsView`/`ArticlesBrowser`/`PracticeBrowser`/`TutorialsBrowser`.
