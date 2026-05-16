## Goal
Let admins mark separate ribbon buttons as the "same" button so editing one (label, icon, size, article link, tab link) updates every place it appears.

## Background — how the data already works
The layout schema in `src/lib/layout-types.ts` already separates **button definitions** from **placements**:

```
layout.buttons[id] = { id, label, icon, variant, articleId, linkToTabId, … }
layout.tabs[t].groups[g].columns[c] = [ "buttonId", "buttonId", … ]   // just id refs
```

So a single button id can already be placed in multiple groups/tabs and any edit propagates automatically. The reason duplicates exist today is that `defaultInventorLayout` and `addButton()` mint a fresh id per placement (e.g. `fillet` on the Model tab and `sk-fillet` on the Sketch tab are two distinct entries). We don't need a new "link" field — we need UI to **consolidate two ids into one** and to **place an existing button** into a new slot.

## Plan

### 1. "Place existing button" when adding
In `src/routes/admin.inventor.tsx`, alongside the current `addButton(gi, ci, variant)` action, add a second action `addExistingButton(gi, ci, existingId)` that just pushes the existing id into the target column without creating a new entry in `layout.buttons`.

Surface this in the column's add menu (next to "Add Large / Small / Split…") as **"Insert existing button…"**, opening a small searchable picker listing every entry in `layout.buttons` (label + icon preview + the tabs it currently appears in, so the admin can tell what they're linking to).

### 2. "Link to another button" from the editor
In the right-hand button editor panel (where `editingBtn` is edited), add a **Linked instances** section:

- Shows how many placements this button currently has and on which tabs (computed by scanning `layout.tabs[*].groups[*].columns[*]`).
- A **"Link to existing button…"** button opens the same picker as above. Picking target id `T` for current id `C`:
  1. Replace every occurrence of `C` in every `columns[]` array with `T`.
  2. Delete `layout.buttons[C]`.
  3. Switch the right panel selection to `T`.
- A **"Unlink this placement"** button (only shown when the button has >1 placement) clones the definition under a new id and swaps just the currently-edited placement to that new id, so the admin can make this one instance diverge again.

### 3. Clean up defaults (optional, recommended)
`src/lib/default-inventor-layout.ts` currently defines parallel buttons such as `fillet`/`sk-fillet`, `mirror`/`sk-mirror`, `circle`/`sk-circle`, etc. Once the linking UI exists, we can either:
- Leave existing programs alone (admins consolidate via the new UI), or
- Ship a small one-time "Find duplicate buttons" helper in the admin (groups entries with identical `label`+`icon.name`, lets the admin merge them in one click).

Recommend shipping the helper since the current Inventor layout has ~10 obvious duplicates.

### 4. Preview & ribbon
No changes needed. `src/components/inventor/Ribbon.tsx` already renders from `buttons[id]`, so shared ids automatically render identically everywhere.

## Out of scope
- No schema/DB migration — `programs.layout` JSON already supports this.
- No changes to articles, emoji, or link-button features.

## Open question
When the admin merges button A into B, should A's article assignment (`articleId`) and `linkToTabId` be preserved if B doesn't have one? Default proposal: **keep B's values as-is**, but show both sets in the picker so the admin can choose which one to keep before confirming the merge. Confirm before I implement.
