## Tutorials

A tutorial is a top-level learning unit divided into ordered **modules**. Each module has its own article-style editor (the same block + docx editor as Articles) and an ordered list of attached practice problems. Learners read each module, do the problems, and mark the module complete.

### Data model (new tables)

```text
tutorials
  id, slug (unique), program_slug, title, summary,
  thumbnail_url, sort_order, published (bool)

tutorial_modules
  id, tutorial_id (fk → tutorials.id, on delete cascade),
  slug (unique within tutorial), title, summary,
  source_kind ('blocks' | 'docx'), content (jsonb), html,
  source_file_path, source_file_name, source_uploaded_at,
  image_overrides (jsonb), sort_order

tutorial_module_problems
  id, module_id (fk → tutorial_modules.id, cascade),
  problem_id (fk → practice_problems.id, cascade),
  sort_order
  unique(module_id, problem_id)

tutorial_module_progress
  id, user_id, module_id (fk, cascade),
  completed_at timestamptz
  unique(user_id, module_id)
```

Grants: `tutorials`, `tutorial_modules`, `tutorial_module_problems` → `SELECT` to `anon` + `authenticated` (public read); `INSERT/UPDATE/DELETE` to `authenticated` gated by `has_role(auth.uid(),'admin')`. `tutorial_module_progress` → `SELECT/INSERT/UPDATE/DELETE` to `authenticated` scoped to `auth.uid() = user_id`; no `anon`.

### Admin

New routes mirroring the Articles admin:

- `/admin/tutorials` — list + create (title → slug), delete, search. Header gets a "Tutorials →" link from Practice and Articles admin pages.
- `/admin/tutorials/$slug` — tutorial editor:
  - Title, summary, thumbnail (uses `practice-assets` bucket), published toggle.
  - Ordered list of **modules** with add / rename / reorder (drag) / delete.
  - Click a module → opens the module editor in a side panel or `/admin/tutorials/$slug/$moduleSlug`.
- Module editor reuses `DocumentEditor` + `DocxUploader` + `DocxImageEditor` exactly like `admin.articles.$slug.tsx` — same blocks, same docx flow, same image overrides.
- Module editor also has an **Attached practice problems** section: search/pick from existing `practice_problems`, reorder, remove.

### Learner experience

`TutorialsView` gets a third active learning path **"Tutorials"** alongside Practice (Video Tutorials placeholder stays). New component `TutorialsBrowser`:

- Grid of published tutorials (thumbnail, title, summary, module count, % complete badge if signed in).
- Click → tutorial detail view: left rail lists modules (numbered, with check when completed), right pane shows the active module rendered via `ArticleRenderer` (or docx html), followed by an **"Practice problems for this module"** section listing the attached problems as cards that open the existing practice viewer.
- "Mark module complete" button at bottom of each module. When signed out, the button shows "Sign in to track progress" inline CTA (no redirect). Progress reads/writes `tutorial_module_progress`.
- Tutorial-level % complete = completed modules / total modules.

### Hooks / files

- `src/hooks/useTutorials.ts` — `useTutorials(programSlug)`, `useTutorialBySlug(slug)` (includes modules + attached problem ids), `useTutorialModule(id)`.
- `src/hooks/useTutorialProgress.ts` — read user's completed module ids for a tutorial; `markComplete` / `unmark` mutations.
- `src/components/tutorials/TutorialsBrowser.tsx`, `TutorialView.tsx`, `ModuleReader.tsx`.
- `src/routes/admin.tutorials.index.tsx`, `admin.tutorials.$slug.tsx`, `admin.tutorials.$slug.$moduleSlug.tsx`.
- Update `TutorialsView.tsx`: add `tutorials` path (active), render `TutorialsBrowser`.

### Out of scope (stated as "later")

- Auto-complete modules based on practice-problem completion (manual now; the schema supports adding it without migration since `practice_problems` ids are already linked).
- Quizzes, certificates, prerequisites between modules.
- Reordering practice problems across modules / copying modules between tutorials.

### Technical notes

- Public read uses the browser supabase client with the new `SELECT TO anon` policies — no server function required for listing/reading tutorials.
- Progress mutations use the browser client under `auth.uid()` policies; gated behind a signed-in check in the UI.
- Module content reuses `Block[]` from `src/lib/article-types.ts` and the existing `applyImageOverrides` pipeline, so the renderer is shared with Articles.
- Slug generation and thumbnail upload mirror existing patterns in `admin.practice.index.tsx` / `admin.practice.$slug.tsx`.
