
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'blocks',
  ADD COLUMN IF NOT EXISTS html text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_file_path text,
  ADD COLUMN IF NOT EXISTS source_file_name text,
  ADD COLUMN IF NOT EXISTS source_uploaded_at timestamptz;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_source_kind_check
  CHECK (source_kind IN ('blocks', 'docx'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('article-assets', 'article-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anyone reads article-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-assets');

CREATE POLICY "admins write article-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update article-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete article-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-assets' AND public.has_role(auth.uid(), 'admin'));
