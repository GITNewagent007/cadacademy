import { useEffect, useState } from "react";

export type ImageStatus = { w: number; h: number } | "error" | "loading";

// Session-wide cache so revisiting an article is instant and shift-free.
const cache = new Map<string, { w: number; h: number } | "error">();
const inflight = new Map<string, Promise<void>>();

function preload(url: string): Promise<void> {
  const existing = inflight.get(url);
  if (existing) return existing;
  const p = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache.set(url, { w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      resolve();
    };
    img.onerror = () => {
      cache.set(url, "error");
      resolve();
    };
    img.src = url;
  });
  inflight.set(url, p);
  return p;
}

/** Returns a Map of url -> dimensions (or "loading"/"error"). Triggers a
 * preload for any URLs we haven't seen so the bytes are already in cache when
 * the real <img> renders into the reserved aspect-ratio box. */
export function useImageDimensions(urls: string[]): Map<string, ImageStatus> {
  const key = urls.slice().sort().join("|");
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const missing = urls.filter((u) => !cache.has(u));
    if (missing.length === 0) return;
    Promise.all(missing.map((u) => preload(u).then(() => {
      if (!cancelled) setTick((t) => t + 1);
    })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const out = new Map<string, ImageStatus>();
  for (const u of urls) {
    const v = cache.get(u);
    out.set(u, v ?? "loading");
  }
  return out;
}

export function getCachedDimensions(url: string): { w: number; h: number } | null {
  const v = cache.get(url);
  return v && v !== "error" ? v : null;
}
