
CREATE TABLE public.practice_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text NOT NULL DEFAULT '',
  program_slug text NOT NULL DEFAULT 'inventor',
  problem_type text NOT NULL DEFAULT 'Part',
  level text NOT NULL DEFAULT 'Easy',
  duration_minutes int NOT NULL DEFAULT 10,
  features_used text[] NOT NULL DEFAULT '{}',
  certification text,
  thumbnail_url text,
  drawing_url text,
  model_url text,
  instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX practice_problems_program_idx ON public.practice_problems(program_slug);
CREATE INDEX practice_problems_level_idx ON public.practice_problems(level);
CREATE INDEX practice_problems_type_idx ON public.practice_problems(problem_type);

GRANT SELECT ON public.practice_problems TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_problems TO authenticated;
GRANT ALL ON public.practice_problems TO service_role;

ALTER TABLE public.practice_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads practice problems"
  ON public.practice_problems FOR SELECT
  USING (true);

CREATE POLICY "admins write practice problems"
  ON public.practice_problems FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER practice_problems_touch_updated_at
  BEFORE UPDATE ON public.practice_problems
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
