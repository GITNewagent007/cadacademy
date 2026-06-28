
-- tutorials
CREATE TABLE public.tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  program_slug text NOT NULL DEFAULT 'inventor',
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tutorials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorials TO authenticated;
GRANT ALL ON public.tutorials TO service_role;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutorials read all" ON public.tutorials FOR SELECT USING (true);
CREATE POLICY "tutorials admin write" ON public.tutorials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tutorials_touch BEFORE UPDATE ON public.tutorials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- tutorial_modules
CREATE TABLE public.tutorial_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id uuid NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  source_kind text NOT NULL DEFAULT 'blocks' CHECK (source_kind IN ('blocks','docx')),
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  html text NOT NULL DEFAULT '',
  source_file_path text,
  source_file_name text,
  source_uploaded_at timestamptz,
  image_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tutorial_id, slug)
);
CREATE INDEX tutorial_modules_tutorial_idx ON public.tutorial_modules (tutorial_id, sort_order);
GRANT SELECT ON public.tutorial_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorial_modules TO authenticated;
GRANT ALL ON public.tutorial_modules TO service_role;
ALTER TABLE public.tutorial_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutorial_modules read all" ON public.tutorial_modules FOR SELECT USING (true);
CREATE POLICY "tutorial_modules admin write" ON public.tutorial_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tutorial_modules_touch BEFORE UPDATE ON public.tutorial_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- tutorial_module_problems
CREATE TABLE public.tutorial_module_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.tutorial_modules(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.practice_problems(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, problem_id)
);
CREATE INDEX tutorial_module_problems_module_idx ON public.tutorial_module_problems (module_id, sort_order);
GRANT SELECT ON public.tutorial_module_problems TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorial_module_problems TO authenticated;
GRANT ALL ON public.tutorial_module_problems TO service_role;
ALTER TABLE public.tutorial_module_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutorial_module_problems read all" ON public.tutorial_module_problems FOR SELECT USING (true);
CREATE POLICY "tutorial_module_problems admin write" ON public.tutorial_module_problems FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- tutorial_module_progress
CREATE TABLE public.tutorial_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.tutorial_modules(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
CREATE INDEX tutorial_module_progress_user_idx ON public.tutorial_module_progress (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorial_module_progress TO authenticated;
GRANT ALL ON public.tutorial_module_progress TO service_role;
ALTER TABLE public.tutorial_module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_progress own select" ON public.tutorial_module_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "module_progress own insert" ON public.tutorial_module_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "module_progress own update" ON public.tutorial_module_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "module_progress own delete" ON public.tutorial_module_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
