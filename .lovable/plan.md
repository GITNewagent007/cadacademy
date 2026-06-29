# Route-Based Navigation Refactor

Replace local-state navigation with real TanStack Router routes so browser history, deep links, refresh, and back/forward all work. Admin and the sim's internal ribbon-tab state are left alone.

## New route tree under `/learn/inventor`

Convert `src/routes/learn.inventor.tsx` into a layout (`<Outlet />`) and add file-based children:

```text
/learn/inventor                       → redirect to /learn/inventor/part
/learn/inventor/part                  → sim (Ribbon + FeatureTree + Viewport)
/learn/inventor/articles              → ArticlesBrowser list (master-detail)
/learn/inventor/articles/$slug        → ArticlesBrowser with right pane loaded
/learn/inventor/learn                 → TutorialsView landing (redirects to /practice)
/learn/inventor/learn/practice        → PracticeBrowser list
/learn/inventor/learn/practice/$slug  → PracticeDetail
/learn/inventor/learn/tutorials       → TutorialsList
/learn/inventor/learn/tutorials/$slug → TutorialView (first module)
/learn/inventor/learn/tutorials/$slug/$moduleSlug → TutorialView with specific module
/learn/inventor/learn/videos          → coming-soon
/learn/inventor/learn/first-part      → coming-soon
```

File layout:

```text
src/routes/
  learn.inventor.tsx                          (layout: FileTabs + <Outlet/>)
  learn.inventor.index.tsx                    (redirect → /part)
  learn.inventor.part.tsx
  learn.inventor.articles.tsx                 (master-detail layout + <Outlet/>)
  learn.inventor.articles.index.tsx           (empty-state right pane)
  learn.inventor.articles.$slug.tsx
  learn.inventor.learn.tsx                    (sidebar nav + <Outlet/>)
  learn.inventor.learn.index.tsx              (redirect → /practice)
  learn.inventor.learn.practice.tsx           (<Outlet/>)
  learn.inventor.learn.practice.index.tsx
  learn.inventor.learn.practice.$slug.tsx
  learn.inventor.learn.tutorials.tsx          (<Outlet/>)
  learn.inventor.learn.tutorials.index.tsx
  learn.inventor.learn.tutorials.$slug.tsx
  learn.inventor.learn.tutorials.$slug.$moduleSlug.tsx
  learn.inventor.learn.videos.tsx
  learn.inventor.learn.first-part.tsx
```

## Component changes

- **`FileTabs`** — props become optional; internally use `<Link>` per tab with `activeProps` for the "selected" style. Three top-level tabs map to `/part`, `/learn`, `/articles`.
- **`TutorialsView`** (left sidebar with Practice/Tutorials/Videos/First-part) — sidebar buttons become `<Link>`s; the right side becomes `<Outlet/>`.
- **`TutorialsBrowser`** — split:
  - `TutorialsList` stays, but cards become `<Link to="/learn/inventor/learn/tutorials/$slug">`.
  - `TutorialView` reads `slug` (and optional `moduleSlug`) from route params via `Route.useParams()`; module rail buttons become `<Link>`s; "open attached problem" becomes `<Link to=".../practice/$slug">`.
  - Remove `selectedSlug` / `practiceSlug` / `activeId` `useState`s entirely.
- **`PracticeBrowser`** — cards become `<Link>`s; remove `selectedSlug`. `PracticeDetail` reads slug from route params. Filter/search state stays local.
- **`ArticlesBrowser`** — switch from id-based to **slug**-based selection (use `useArticleBySlug`, already exists). List items become `<Link to="/learn/inventor/articles/$slug">`. The route's `$slug` child swaps the right pane in.
- **`learn.inventor.tsx`** — keep existing `validateSearch` for the sim's `?tab=`/`?article=` deep links and the existing `ApplySearchParams` wiring; only the sim route mounts it (so it's not run on tutorials/articles pages). `activeFile` state deleted.

## Data loading

Keep current React Query hooks; no loader changes required. (Loaders are optional polish — out of scope for this refactor.)

## Out of scope

- Admin routes (already file-based; no state navigation found).
- The sim's internal `activeTabId` / `activeButtonId` / `activeArticleId` in `InventorSimProvider`. These are per-click UI state — routing them would mean a URL change on every ribbon click, which is worse UX, not better. The existing `?tab=` and `?article=` query-param deep links remain.
- `auth.tsx`'s sign-in/sign-up toggle.

## Verification

After implementation: `bunx tsgo --noEmit`, then drive Playwright through the flows: list → detail → back button restores list; refresh on a deep link renders the same view; opening a tutorial module URL directly loads that module; clicking an attached practice problem from a module navigates and back returns to the module.
