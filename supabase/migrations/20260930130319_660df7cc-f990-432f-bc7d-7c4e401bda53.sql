DROP POLICY "tutorials read published" ON public.tutorials;
CREATE POLICY "tutorials read published" ON public.tutorials FOR SELECT TO anon, authenticated USING (published = true);
DROP POLICY "tutorial_modules read published" ON public.tutorial_modules;
CREATE POLICY "tutorial_modules read published" ON public.tutorial_modules FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.tutorials t WHERE t.id = tutorial_modules.tutorial_id AND t.published = true));
DROP POLICY "tutorial_module_problems read published" ON public.tutorial_module_problems;
CREATE POLICY "tutorial_module_problems read published" ON public.tutorial_module_problems FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.tutorial_modules m JOIN public.tutorials t ON t.id = m.tutorial_id WHERE m.id = tutorial_module_problems.module_id AND t.published = true));