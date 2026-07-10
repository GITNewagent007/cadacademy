
-- 1. Restrict tutorial_modules SELECT to published tutorials (or admin)
DROP POLICY IF EXISTS "tutorial_modules read all" ON public.tutorial_modules;
CREATE POLICY "tutorial_modules read published"
  ON public.tutorial_modules FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.tutorials t
      WHERE t.id = tutorial_modules.tutorial_id AND t.published = true
    )
  );

-- 2. Restrict tutorial_module_problems SELECT similarly
DROP POLICY IF EXISTS "tutorial_module_problems read all" ON public.tutorial_module_problems;
CREATE POLICY "tutorial_module_problems read published"
  ON public.tutorial_module_problems FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.tutorial_modules m
      JOIN public.tutorials t ON t.id = m.tutorial_id
      WHERE m.id = tutorial_module_problems.module_id AND t.published = true
    )
  );

-- 3. Remove overly-permissive anonymous INSERT on feedback_reports
-- (all inserts go through the /api/public/feedback route with service_role)
DROP POLICY IF EXISTS "anyone can insert feedback" ON public.feedback_reports;

-- 4. Lock down SECURITY DEFINER email helper functions:
--    revoke EXECUTE from anon/public and pin search_path.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;
