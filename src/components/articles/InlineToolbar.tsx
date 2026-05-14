import { Bold, Italic, Code, Link as LinkIcon } from "lucide-react";
import type { RefObject } from "react";

type Field = HTMLTextAreaElement | HTMLInputElement;

/** Wrap the current selection in `before`/`after`. If no selection, inserts a placeholder. */
function wrapSelection(
  el: Field,
  before: string,
  after: string,
  placeholder: string,
  onChange: (next: string) => void,
) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const selected = el.value.slice(start, end) || placeholder;
  const next = el.value.slice(0, start) + before + selected + after + el.value.slice(end);
  onChange(next);
  // restore caret around the inserted content
  requestAnimationFrame(() => {
    el.focus();
    const s = start + before.length;
    el.setSelectionRange(s, s + selected.length);
  });
}

function insertLink(el: Field, onChange: (next: string) => void) {
  const url = window.prompt("Link URL (https://…)");
  if (!url) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const selected = el.value.slice(start, end) || window.prompt("Link text") || url;
  const insert = `[${selected}](${url})`;
  const next = el.value.slice(0, start) + insert + el.value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + insert.length;
    el.setSelectionRange(pos, pos);
  });
}

export function InlineToolbar({
  fieldRef,
  value,
  onChange,
}: {
  fieldRef: RefObject<Field | null>;
  value: string;
  onChange: (next: string) => void;
}) {
  function act(fn: (el: Field) => void) {
    return () => {
      const el = fieldRef.current;
      if (!el) return;
      fn(el);
    };
  }
  // value is unused at runtime but keeps the toolbar reactive to external changes
  void value;
  const btn = "p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground";
  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-muted/20 px-1 py-0.5">
      <button
        type="button"
        title="Bold (Ctrl+B)"
        className={btn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={act((el) => wrapSelection(el, "**", "**", "bold", onChange))}
      >
        <Bold className="h-3 w-3" />
      </button>
      <button
        type="button"
        title="Italic (Ctrl+I)"
        className={btn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={act((el) => wrapSelection(el, "*", "*", "italic", onChange))}
      >
        <Italic className="h-3 w-3" />
      </button>
      <button
        type="button"
        title="Inline code"
        className={btn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={act((el) => wrapSelection(el, "`", "`", "code", onChange))}
      >
        <Code className="h-3 w-3" />
      </button>
      <button
        type="button"
        title="Insert link (Ctrl+K)"
        className={btn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={act((el) => insertLink(el, onChange))}
      >
        <LinkIcon className="h-3 w-3" />
      </button>
      <span className="ml-auto text-[10px] text-muted-foreground pr-1">
        **bold** *italic* `code` [text](url)
      </span>
    </div>
  );
}

/** Keyboard handler for B/I/K shortcuts inside a text field. */
export function inlineKeydown(
  e: React.KeyboardEvent<Field>,
  value: string,
  onChange: (next: string) => void,
) {
  if (!(e.ctrlKey || e.metaKey)) return;
  const el = e.currentTarget;
  if (e.key === "b" || e.key === "B") {
    e.preventDefault();
    wrapSelection(el, "**", "**", "bold", onChange);
  } else if (e.key === "i" || e.key === "I") {
    e.preventDefault();
    wrapSelection(el, "*", "*", "italic", onChange);
  } else if (e.key === "k" || e.key === "K") {
    e.preventDefault();
    insertLink(el, onChange);
  }
  void value;
}
