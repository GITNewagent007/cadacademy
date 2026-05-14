import { useEffect, useRef, useState } from "react";
import { applyImageOverrides, imageHashFromSrc, type ImageAlign, type ImageOverrides } from "@/lib/article-types";
import { cn } from "@/lib/utils";

const ALIGNS: { value: ImageAlign; label: string }[] = [
  { value: "left", label: "Wrap left" },
  { value: "right", label: "Wrap right" },
  { value: "center", label: "Center" },
  { value: "inline", label: "Inline" },
  { value: "none", label: "Block (no wrap)" },
];

/** Renders docx HTML and lets the admin click any image to change its
 * text-wrap alignment. Changes flow up via `onChange`. */
export function DocxImageEditor({
  html,
  overrides,
  onChange,
}: {
  html: string;
  overrides: ImageOverrides;
  onChange: (next: ImageOverrides) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<{ hash: string; x: number; y: number } | null>(null);

  const merged = applyImageOverrides(html, overrides);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG") {
        setPopover(null);
        return;
      }
      const src = (target as HTMLImageElement).getAttribute("src") || "";
      const hash = imageHashFromSrc(src);
      if (!hash) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = target.getBoundingClientRect();
      const containerRect = el.getBoundingClientRect();
      setPopover({
        hash,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      });
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [merged]);

  // outline images so admin knows they are interactive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll("img").forEach((img) => {
      (img as HTMLImageElement).style.cursor = "pointer";
      img.setAttribute("title", "Click to change alignment");
    });
  }, [merged]);

  const setAlign = (hash: string, align: ImageAlign) => {
    const next = { ...overrides, [hash]: align };
    onChange(next);
    setPopover(null);
  };
  const clearAlign = (hash: string) => {
    const next = { ...overrides };
    delete next[hash];
    onChange(next);
    setPopover(null);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="prose-doc"
        dangerouslySetInnerHTML={{ __html: merged }}
      />
      {popover && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setPopover(null)}
          />
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-full -mt-1 rounded-md border border-border bg-popover shadow-lg p-1 flex flex-col min-w-[160px]"
            style={{ left: popover.x, top: popover.y }}
          >
            <div className="px-2 py-1 text-[10px] uppercase font-mono-tech text-muted-foreground">
              Image alignment
            </div>
            {ALIGNS.map((a) => {
              const current = overrides[popover.hash];
              const active = current === a.value;
              return (
                <button
                  key={a.value}
                  onClick={() => setAlign(popover.hash, a.value)}
                  className={cn(
                    "text-left px-2 py-1 text-xs rounded hover:bg-muted",
                    active && "bg-muted font-medium",
                  )}
                >
                  {a.label}
                </button>
              );
            })}
            {overrides[popover.hash] && (
              <button
                onClick={() => clearAlign(popover.hash)}
                className="text-left px-2 py-1 text-xs rounded hover:bg-muted text-muted-foreground border-t border-border mt-1"
              >
                Reset to Word default
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
