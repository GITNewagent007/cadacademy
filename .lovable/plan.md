## Add "Collection" metadata to practice problems

Collections work like Problem Type: one collection per problem (nullable), editable list, with a filter dropdown on the browser. Problems keep their existing Problem Type — collections are an independent grouping.

### Database
- Add `collection text NULL` to `practice_problems` (no default; NULL = "no collection").
- Add a btree index on `collection`.
- Reuse the existing `practice_taxonomy` table by introducing a new `kind = 'collection'` (the column is already free-form text, so no schema change needed there).

### Admin
- `src/routes/admin.practice.taxonomy.tsx`: add a fourth `<KindSection title="Collections" kind="collection" />` block. Existing add/edit/reorder/delete logic works as-is.
- `src/hooks/usePracticeTaxonomy.ts`: extend `TaxonomyKind` union with `"collection"`.
- `src/routes/admin.practice.$slug.tsx` (problem editor): add a "Collection" dropdown next to Problem Type / Level, populated from taxonomy `kind='collection'`, with a "— None —" option. Persist to the new column.

### Browser
- `src/hooks/usePracticeProblems.ts`: select and map `collection`; add it to the `PracticeProblem` type.
- `src/components/inventor/PracticeBrowser.tsx`: add a "Collection" filter dropdown alongside the existing filters; filter list by selected collection. Problems remain grouped/displayed under their Problem Type as today — the collection filter just narrows the set.

### Out of scope
- No changes to problem-type behavior or grouping.
- No multi-collection support (per your choice).
