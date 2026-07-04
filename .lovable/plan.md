
## Goal

Let module authors drop an existing article into a tutorial module as an inline block. Readers see a card with the article's title + summary and can expand/collapse it in place to read the full article without leaving the module.

## User flow

**Author (admin)**
1. In the module editor toolbar, click the new "Embed article" button.
2. A picker lists all articles (search by title/slug); pick one.
3. A card is inserted showing the article's title + summary as a placeholder — click it to swap the article, or delete the block like any other.

**Reader (in the tutorial module)**
1. Sees a bordered card: article title, one-line summary, a chevron "Read article" affordance.
2. Clicking expands the card in place, rendering the full article (reusing `ArticleRenderer`) directly inside the module.
3. Clicking again collapses it. No navigation, no overlay.

## Technical plan

### 1. New block type

Add to `src/lib/article-types.ts`:

```ts
| { id: string; type: "articleEmbed"; articleSlug: string; defaultOpen?: boolean }
```

- Update `BLOCK_TYPE_LABELS` ("Embedded article") and `newBlock("articleEmbed")` factory (empty slug).
- No migration needed — module `content` is stored as JSON.

### 2. TipTap extension + doc converters

- New node `src/components/articles/article-embed-extension.ts`: block-level, atom, `articleSlug` + `defaultOpen` attrs, `parseHTML`/`renderHTML` using `data-article-embed` on a `<div>`, plus a `NodeViewWrapper` React node view rendering the same collapsed card the reader uses (so it looks WYSIWYG in the editor).
- Register it in `DocumentEditor` extensions.
- Extend `src/lib/article-doc.ts` `blocksToDoc` / `docToBlocks` to round-trip the new node type (mirrors the existing `linkButton` handling).

### 3. Editor toolbar + picker

- In `DocumentEditor` toolbar, add a `BookOpen` "Embed article" button after the link-button toolbar entry.
- Reuse or add a lightweight `ArticlePickerPopover` (mirrors the pattern of `ProblemPicker` in `admin.tutorials.$slug.tsx`): searches `articles` for `id, slug, title, summary`. On select, `insertContent({ type: "articleEmbed", attrs: { articleSlug } })`.
- Clicking an existing embed block opens the same popover pre-scoped to replace the slug.

### 4. Reader rendering

- Add an `"articleEmbed"` case to `BlockRenderer` in `src/components/articles/ArticleRenderer.tsx`.
- Component `ArticleEmbedBlock`:
  - `useQuery(["article", "slug", slug])` → `supabase.from("articles").select("id, slug, title, summary, content, html, source_kind, image_overrides").eq("slug", slug).maybeSingle()`.
  - Collapsed state (default): rounded-md card, `BookOpen` icon, title, summary, chevron toggle. Loading skeleton and "Article not found" fallback.
  - Expanded: same header (now chevron-down) + `<ArticleRenderer article={...} />` inside a bordered inner container. Recursion is not a real risk (authors control it) but we cap expansion depth via context to 1 to avoid infinite nesting.

### 5. Where the embed shows up

- Works anywhere `ArticleRenderer` renders module content, which is what tutorial modules already use in `TutorialsBrowser` / module viewer. No changes needed in `TutorialsView.tsx` or `TutorialsBrowser.tsx`.
- Also renders inside regular articles for free (nice side effect; capped by the depth guard above).

## Files touched

- `src/lib/article-types.ts` — new `articleEmbed` block variant + label + factory.
- `src/lib/article-doc.ts` — round-trip the new node.
- `src/components/articles/article-embed-extension.ts` — new TipTap node + node view.
- `src/components/articles/DocumentEditor.tsx` — register extension, toolbar button, picker popover.
- `src/components/articles/ArticleRenderer.tsx` — new `ArticleEmbedBlock` renderer + depth guard.

## Out of scope

- Docx-imported modules (`sourceKind === "docx"`): the embed only appears in block-based content. If you also want it in docx modules later, it needs an HTML placeholder + post-render hydration — flag me if that matters.
- No schema/migration changes; existing rows keep working.
