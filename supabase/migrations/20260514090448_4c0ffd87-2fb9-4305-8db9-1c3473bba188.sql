CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "admins write articles" ON public.articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER articles_touch_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX articles_slug_idx ON public.articles(slug);
CREATE INDEX articles_title_idx ON public.articles USING gin (to_tsvector('english', title || ' ' || summary));