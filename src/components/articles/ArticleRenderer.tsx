import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Info, AlertTriangle, Lightbulb, ShieldAlert, ArrowRight, BookOpen, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Article, Block, CalloutVariant, ListNode } from "@/lib/article-types";
import { applyImageOverrides, widthPctToSize } from "@/lib/article-types";
import { renderInline } from "./inline";
import { cn } from "@/lib/utils";
import { useOptionalInventorSim } from "@/components/inventor/store";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useImageDimensions, getCachedDimensions } from "@/hooks/useImageDimensions";
import { useArticleBySlug } from "@/hooks/useArticles";

const calloutStyles: Record<CalloutVariant, { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "border-blue-500/40 bg-blue-500/5 text-foreground" },
  tip: { icon: Lightbulb, cls: "border-emerald-500/40 bg-emerald-500/5 text-foreground" },
  warning: { icon: AlertTriangle, cls: "border-amber-500/40 bg-amber-500/5 text-foreground" },
  danger: { icon: ShieldAlert, cls: "border-destructive/50 bg-destructive/5 text-foreground" },
};

function youtubeEmbed(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function vimeoEmbed(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

/** Renders an article — branches on `sourceKind`. Pass either:
 *  - a full `Article` (preferred), or
 *  - just `blocks` for legacy callers (renders as block-based). */
export function ArticleRenderer({
  article,
  blocks,
}: {
  article?: Article;
  blocks?: Block[];
}) {
  const imageUrls = useMemo(() => extractImageUrls(article, blocks), [article, blocks]);
  const dims = useImageDimensions(imageUrls);

  if (article?.sourceKind === "docx" && article.html) {
    const html = applyImageOverrides(article.html, article.imageOverrides ?? {});
    return <DocxHtml html={html} dims={dims} />;
  }
  const content = article?.content ?? blocks ?? [];
  if (content.length === 0) {
    return <p className="text-sm text-muted-foreground italic">This article has no content yet.</p>;
  }
  return (
    <article className="text-sm text-foreground leading-relaxed [&>*+*]:mt-4">
      {content.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
      <div className="clear-both" />
    </article>
  );
}

function extractImageUrls(article?: Article, blocks?: Block[]): string[] {
  const urls: string[] = [];
  if (article?.sourceKind === "docx" && article.html) {
    const re = /<img[^>]+src=["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(article.html)) !== null) urls.push(m[1]);
    return urls;
  }
  const content = article?.content ?? blocks ?? [];
  for (const b of content) {
    if (b.type === "image" && b.url) urls.push(b.url);
  }
  return urls;
}

/** Renders docx HTML and post-processes <img> tags to reserve their natural
 * aspect ratio with a skeleton background, so text shows immediately and the
 * image bytes paint into a correctly-sized box with no layout shift. */
function DocxHtml({ html, dims }: { html: string; dims: Map<string, unknown> }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll("img"));
    const cleanups: Array<() => void> = [];
    for (const img of imgs) {
      const url = img.getAttribute("src") ?? "";
      const d = getCachedDimensions(url);
      const markLoaded = () => {
        img.removeAttribute("data-skeleton");
        img.style.aspectRatio = "";
      };
      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
        continue;
      }
      img.setAttribute("data-skeleton", "");
      if (d) img.style.aspectRatio = `${d.w} / ${d.h}`;
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", markLoaded, { once: true });
      cleanups.push(() => {
        img.removeEventListener("load", markLoaded);
        img.removeEventListener("error", markLoaded);
      });
    }
    return () => cleanups.forEach((fn) => fn());
    // Re-run when html changes or when new dimension data arrives.
  }, [html, dims]);

  return <div ref={ref} className="prose-doc" dangerouslySetInnerHTML={{ __html: html }} />;
}

function BlockImage({ url, alt }: { url: string; alt: string }) {
  const cached = getCachedDimensions(url);
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === "undefined") return false;
    const img = new window.Image();
    img.src = url;
    return img.complete && img.naturalWidth > 0;
  });
  const aspectRatio = cached ? `${cached.w} / ${cached.h}` : undefined;
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio, minHeight: aspectRatio ? undefined : "2em" }}
    >
      {!loaded && <Skeleton className="absolute inset-0 rounded border border-border" />}
      <img
        src={url}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className="rounded border border-border w-full h-auto block"
        style={{ opacity: loaded ? 1 : 0 }}
        loading="lazy"
      />
    </div>
  );
}

function NestedList({
  ordered,
  nodes,
  depth,
}: {
  ordered: boolean;
  nodes: ListNode[];
  depth: number;
}) {
  const bulletStyles = ["list-disc", "list-[circle]", "list-[square]"];
  const numStyles = ["list-decimal", "list-[lower-alpha]", "list-[lower-roman]"];
  const cls = ordered
    ? numStyles[Math.min(depth, numStyles.length - 1)]
    : bulletStyles[Math.min(depth, bulletStyles.length - 1)];
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={cn("ml-6 space-y-1 pl-1", cls, depth > 0 && "mt-1")}>
      {nodes.map((n, i) => (
        <li key={i} className="pl-1">
          <span>{renderInline(n.text)}</span>
          {n.children && n.children.items.length > 0 && (
            <NestedList
              ordered={n.children.ordered}
              nodes={n.children.items}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </Tag>
  );
}



function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${block.level + 1}`) as "h2" | "h3" | "h4";
      const sizes = { 1: "text-xl font-semibold mt-4", 2: "text-lg font-semibold mt-3", 3: "text-base font-semibold mt-2" };
      return (
        <Tag id={block.id} className={cn("scroll-mt-20 text-foreground clear-both", sizes[block.level])}>
          {renderInline(block.text)}
        </Tag>
      );
    }
    case "paragraph":
      return <p className="whitespace-pre-line">{renderInline(block.text)}</p>;
    case "list": {
      if (block.nodes && block.nodes.length) {
        return <NestedList ordered={block.ordered} nodes={block.nodes} depth={0} />;
      }
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={cn("ml-6 space-y-1 pl-1", block.ordered ? "list-decimal" : "list-disc")}>
          {block.items.map((it, i) => (
            <li key={i} className="pl-1">{renderInline(it)}</li>
          ))}
        </Tag>
      );
    }
    case "image": {
      const align = block.align ?? "block";
      const size = block.size ?? widthPctToSize(block.widthPct);
      const sizeCls =
        size === "sm"
          ? "max-w-[12em]"
          : size === "md"
            ? "max-w-[24em]"
            : size === "lg"
              ? "max-w-[40em]"
              : "w-full";
      const figClass = cn(
        "my-2",
        align === "wrap-left" && "float-left mr-4 mb-2 clear-left",
        align === "wrap-right" && "float-right ml-4 mb-2 clear-right",
        align === "center" && "mx-auto",
        align === "full" && "w-full",
        align === "block" && "block",
        sizeCls,
      );
      return (
        <figure className={figClass}>
          {block.url ? (
            <BlockImage url={block.url} alt={block.alt ?? ""} />
          ) : (
            <div className="aspect-video rounded border border-dashed border-border bg-muted/40 grid place-items-center text-xs text-muted-foreground">
              No image URL
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-1 text-xs text-muted-foreground">{block.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "video": {
      const yt = youtubeEmbed(block.url);
      const vm = vimeoEmbed(block.url);
      const embed = yt ?? vm;
      return (
        <figure className="my-2">
          {embed ? (
            <div className="aspect-video w-full overflow-hidden rounded border border-border">
              <iframe
                src={embed}
                title={block.caption ?? "Video"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : block.url ? (
            <video src={block.url} controls className="w-full rounded border border-border" />
          ) : (
            <div className="aspect-video rounded border border-dashed border-border bg-muted/40 grid place-items-center text-xs text-muted-foreground">
              No video URL
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-1 text-xs text-muted-foreground">{block.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold border-b border-border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="even:bg-muted/20">
                  {row.map((c, ci) => (
                    <td key={ci} className="px-3 py-1.5 border-t border-border align-top">
                      {renderInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout": {
      const { icon: Icon, cls } = calloutStyles[block.variant];
      return (
        <div className={cn("flex gap-2 rounded-md border p-3", cls)}>
          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-sm whitespace-pre-line">{renderInline(block.text)}</div>
        </div>
      );
    }
    case "code":
      return (
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono-tech border border-border">
          <code>{block.code}</code>
        </pre>
      );
    case "divider":
      return <hr className="border-border clear-both" />;
    case "linkButton":
      return <LinkButtonRender block={block} />;
    case "articleEmbed":
      return <ArticleEmbedBlock block={block} />;
  }
}

const EmbedDepthContext = createContext(0);

function ArticleEmbedBlock({
  block,
}: {
  block: Extract<Block, { type: "articleEmbed" }>;
}) {
  const depth = useContext(EmbedDepthContext);
  const [open, setOpen] = useState(Boolean(block.defaultOpen));
  const { data: article, isLoading } = useArticleBySlug(block.articleSlug || null);

  if (!block.articleSlug) {
    return (
      <div className="my-3 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground italic clear-both">
        Embedded article — no article selected.
      </div>
    );
  }

  return (
    <div className="my-3 rounded-md border border-border bg-card overflow-hidden clear-both">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
      >
        <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            {isLoading ? "Loading article…" : article?.title ?? "Article not found"}
          </div>
          {article?.summary && (
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {article.summary}
            </div>
          )}
          {!article && !isLoading && (
            <div className="text-xs text-muted-foreground mt-0.5 font-mono-tech">
              {block.articleSlug}
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
          {open ? "Hide" : "Read article"}
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
      </button>
      {open && article && (
        <div className="border-t border-border bg-background px-4 py-4">
          {depth >= 1 ? (
            <p className="text-xs text-muted-foreground italic">
              Nested embedded articles are not expanded to avoid infinite nesting.
            </p>
          ) : (
            <EmbedDepthContext.Provider value={depth + 1}>
              <ArticleRenderer article={article} />
            </EmbedDepthContext.Provider>
          )}
        </div>
      )}
    </div>
  );
}

function LinkButtonRender({
  block,
}: {
  block: Extract<Block, { type: "linkButton" }>;
}) {
  const sim = useOptionalInventorSim();
  const navigate = useNavigate();
  const variant = block.variant ?? "primary";
  const cls =
    variant === "secondary"
      ? "border-border bg-muted text-foreground hover:bg-muted/70"
      : "border-primary bg-primary text-primary-foreground hover:bg-primary/90";

  const handle = async () => {
    if (block.target === "tab") {
      if (!block.tabId) return;
      if (sim) {
        sim.setActiveTab(block.tabId);
        sim.close();
      } else {
        navigate({ to: "/learn/inventor/part1/$tabId", params: { tabId: block.tabId } });
      }
      return;
    }
    // target === "article"
    if (!block.articleSlug) return;
    if (sim) {
      const { data } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", block.articleSlug)
        .maybeSingle();
      if (data?.id) sim.openArticle(data.id);
    } else {
      navigate({ to: "/learn/inventor/articles/$slug", params: { slug: block.articleSlug } });
    }
  };

  return (
    <div className="my-3 clear-both">
      <button
        type="button"
        onClick={handle}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
          cls,
        )}
      >
        {block.label || "Open"}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
