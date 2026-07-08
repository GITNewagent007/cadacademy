ALTER TABLE public.practice_taxonomy DROP CONSTRAINT IF EXISTS practice_taxonomy_kind_check;
ALTER TABLE public.practice_taxonomy ADD CONSTRAINT practice_taxonomy_kind_check CHECK (kind = ANY (ARRAY['feature'::text, 'level'::text, 'problem_type'::text, 'collection'::text, 'sponsor'::text]));
ALTER TABLE public.practice_taxonomy ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.practice_problems ADD COLUMN IF NOT EXISTS sponsor text;
CREATE INDEX IF NOT EXISTS practice_problems_sponsor_idx ON public.practice_problems(sponsor);