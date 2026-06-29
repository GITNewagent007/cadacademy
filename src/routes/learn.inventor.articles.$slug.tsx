import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useArticleBySlug } from "@/hooks/useArticles";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";

export const Route = createFileRoute("/learn/inventor/articles/$slug")({
  component: ArticleDetail,
});

function ArticleDetail() {
  const { slug } = Route.useParams();
  const { data: article, isLoading } = useArticleBySlug(slug);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading article…
      </div>
    );
  }
  if (!article) {
    return <div className="p-6 text-sm text-muted-foreground">Article not found.</div>;
  }
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-2">{article.title}</h1>
      {article.summary && (
        <p className="text-sm text-muted-foreground mb-6">{article.summary}</p>
      )}
      <ArticleRenderer article={article} />
    </div>
  );
}
