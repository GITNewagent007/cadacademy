
CREATE TABLE public.practice_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('feature','level','problem_type')),
  program_slug text NOT NULL DEFAULT 'inventor',
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, program_slug, label)
);

GRANT SELECT ON public.practice_taxonomy TO anon, authenticated;
GRANT ALL ON public.practice_taxonomy TO authenticated, service_role;

ALTER TABLE public.practice_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read taxonomy" ON public.practice_taxonomy FOR SELECT USING (true);
CREATE POLICY "Admins manage taxonomy" ON public.practice_taxonomy FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER practice_taxonomy_updated_at
  BEFORE UPDATE ON public.practice_taxonomy
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed defaults
INSERT INTO public.practice_taxonomy (kind, program_slug, label, sort_order) VALUES
  ('level','inventor','Easy',1),
  ('level','inventor','Medium',2),
  ('level','inventor','Hard',3),
  ('problem_type','inventor','Part',1),
  ('problem_type','inventor','Assembly',2),
  ('problem_type','inventor','Drawing',3),
  ('problem_type','inventor','Sheet Metal',4),
  ('problem_type','inventor','Surface',5),
  ('feature','inventor','Extrude',1),
  ('feature','inventor','Revolve',2),
  ('feature','inventor','Sweep',3),
  ('feature','inventor','Loft',4),
  ('feature','inventor','Fillet',5),
  ('feature','inventor','Chamfer',6),
  ('feature','inventor','Hole',7),
  ('feature','inventor','Shell',8),
  ('feature','inventor','Pattern',9),
  ('feature','inventor','Mirror',10),
  ('feature','inventor','Thread',11),
  ('feature','inventor','Rib',12);
