GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

INSERT INTO public.user_roles (user_id, role)
VALUES ('5b6f91bb-e7c9-43ea-ac14-2fc6a2cc37b6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;