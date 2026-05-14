import { Fragment, type ReactNode } from "react";

/** Minimal inline markdown: [text](url), **bold**, *italic*, `code`.
 * Keeps the editor surface simple while supporting the most common needs.
 * Unknown sequences fall through as plain text. */
export function renderInline(text: string): ReactNode {
  if (!text) return null;
  const parts: ReactNode[] = [];
  // Order matters — emoji + links first (they contain other characters).
  const regex = /\{\{e:([^}|]+)(?:\|([^}]+))?\}\}|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1]) {
      parts.push(
        <img
          key={key++}
          src={m[1]}
          alt={m[2] || "emoji"}
          className="custom-emoji inline-block align-[-0.25em] mx-[0.05em]"
          style={{ height: "1.25em", width: "auto" }}
          loading="lazy"
        />,
      );
    } else if (m[3] && m[4]) {
      parts.push(
        <a
          key={key++}
          href={m[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:no-underline"
        >
          {m[3]}
        </a>,
      );
    } else if (m[5]) {
      parts.push(<strong key={key++} className="font-semibold">{m[5]}</strong>);
    } else if (m[6]) {
      parts.push(<em key={key++}>{m[6]}</em>);
    } else if (m[7]) {
      parts.push(
        <code key={key++} className="rounded bg-muted px-1 py-0.5 font-mono-tech text-[0.85em]">
          {m[7]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return parts;
}
