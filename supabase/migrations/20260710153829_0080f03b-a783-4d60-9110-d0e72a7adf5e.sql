
CREATE TABLE public.feedback_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issue_type text NOT NULL,
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 4000),
  page_url text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.feedback_reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.feedback_reports TO authenticated;
GRANT ALL ON public.feedback_reports TO service_role;

ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert feedback"
  ON public.feedback_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins can read feedback"
  ON public.feedback_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can update feedback"
  ON public.feedback_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can delete feedback"
  ON public.feedback_reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER feedback_reports_touch
  BEFORE UPDATE ON public.feedback_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
