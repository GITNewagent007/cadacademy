CREATE TABLE public.custom_emojis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_emojis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads emojis" ON public.custom_emojis
  FOR SELECT USING (true);

CREATE POLICY "admins write emojis" ON public.custom_emojis
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));