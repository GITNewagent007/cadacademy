import { useEffect, useMemo, useState } from "react";
import type { Article } from "@/lib/article-types";

/** Extracts every image URL referenced by an article (block-based or docx HTML)
 * and preloads them. Returns `true` once all images have loaded or errored, so
 * the article can be revealed in one go with no layout shifts as images pop in. */
export function useArticleImagesReady(article?: Article | null): boolean {
  const urls = useMemo(() => extractImageUrls(article), [article]);
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

function extractImageUrls(article?: Article | null): string[] {
  if (!article) return [];
  const urls: string[] = [];
  if (article.sourceKind === "docx" && article.html) {
    const re = /<img[^>]+src=["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(article.html)) !== null) urls.push(m[1]);
    return urls;
  }
  for (const b of article.content ?? []) {
    if (b.type === "image" && b.url) urls.push(b.url);
  }
  return urls;
}
