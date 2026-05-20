import { useEffect, useState } from "react";
import type { Layout } from "@/lib/layout-types";

/**
 * Preloads all image icons referenced by the layout. Returns `true` once every
 * image has either loaded or errored, so the UI can reveal all icons at once
 * (instead of popping in one-by-one).
 */
export function useIconsReady(layout: Layout): boolean {
  const urls = Object.values(layout.buttons)
    .map((b) => (b.icon.type === "image" ? b.icon.url : null))
    .filter((u): u is string => !!u);
  const key = urls.slice().sort().join("|");

  const [ready, setReady] = useState(urls.length === 0);

  useEffect(() => {
    if (urls.length === 0) {
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    let remaining = urls.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0 && !cancelled) setReady(true);
    };
    for (const url of urls) {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ready;
}
