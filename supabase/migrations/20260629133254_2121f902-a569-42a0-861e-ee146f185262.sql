
CREATE TABLE public.practice_problem_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.practice_problems(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_problem_progress TO authenticated;
GRANT ALL ON public.practice_problem_progress TO service_role;

ALTER TABLE public.practice_problem_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own practice progress"
  ON public.practice_problem_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own practice progress"
  ON public.practice_problem_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own practice progress"
  ON public.practice_problem_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own practice progress"
  ON public.practice_problem_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX practice_problem_progress_user_idx ON public.practice_problem_progress(user_id);
