import { Info, AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";
import type { Article, Block, CalloutVariant } from "@/lib/article-types";
import { applyImageOverrides } from "@/lib/article-types";
import { renderInline } from "./inline";
import { cn } from "@/lib/utils";

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
  if (article?.sourceKind === "docx" && article.html) {
    const html = applyImageOverrides(article.html, article.imageOverrides ?? {});
    return (
      <div
        className="prose-doc"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  const content = article?.content ?? blocks ?? [];
  if (content.length === 0) {
    return <p className="text-sm text-muted-foreground italic">This article has no content yet.</p>;
  }
  return (
    <article className="space-y-4 text-sm text-foreground leading-relaxed">
      {content.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </article>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${block.level + 1}`) as "h2" | "h3" | "h4";
      const sizes = { 1: "text-xl font-semibold mt-4", 2: "text-lg font-semibold mt-3", 3: "text-base font-semibold mt-2" };
      return (
        <Tag id={block.id} className={cn("scroll-mt-20 text-foreground", sizes[block.level])}>
          {block.text}
        </Tag>
      );
    }
    case "paragraph":
      return <p className="whitespace-pre-line">{renderInline(block.text)}</p>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={cn("ml-5 space-y-1", block.ordered ? "list-decimal" : "list-disc")}>
          {block.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </Tag>
      );
    }
    case "image":
      return (
        <figure className="my-2">
          {block.url ? (
            <img
              src={block.url}
              alt={block.alt ?? ""}
              className="rounded border border-border max-w-full h-auto"
              loading="lazy"
            />
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
      return <hr className="border-border" />;
  }
}
