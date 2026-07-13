ALTER TABLE public.practice_taxonomy ADD COLUMN IF NOT EXISTS relationship text NOT NULL DEFAULT 'sponsored';
ALTER TABLE public.practice_taxonomy DROP CONSTRAINT IF EXISTS practice_taxonomy_relationship_check;
ALTER TABLE public.practice_taxonomy ADD CONSTRAINT practice_taxonomy_relationship_check CHECK (relationship IN ('sponsored','supported'));