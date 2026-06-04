CREATE TABLE public.article_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.article_categories(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.article_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_categories TO authenticated;
GRANT ALL ON public.article_categories TO service_role;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads article_categories" ON public.article_categories FOR SELECT USING (true);
CREATE POLICY "admins write article_categories" ON public.article_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX article_categories_parent_idx ON public.article_categories(parent_id);
CREATE TRIGGER article_categories_touch BEFORE UPDATE ON public.article_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.article_category_assignments (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.article_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, category_id)
);
GRANT SELECT ON public.article_category_assignments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_category_assignments TO authenticated;
GRANT ALL ON public.article_category_assignments TO service_role;
ALTER TABLE public.article_category_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads article_category_assignments" ON public.article_category_assignments FOR SELECT USING (true);
CREATE POLICY "admins write article_category_assignments" ON public.article_category_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX article_cat_assign_category_idx ON public.article_category_assignments(category_id);