
-- Set search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

-- Revoke broad execute on SECURITY DEFINER has_role (only used inside policies, which run as definer anyway)
revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;

-- Restrict bucket listing: still allow reading individual files publicly, but require knowing the path
drop policy if exists "public read icons" on storage.objects;
create policy "public read icon files" on storage.objects
  for select using (bucket_id = 'button-icons' and (storage.foldername(name))[1] is not null);
