
-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "admins read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Programs (CAD apps being simulated)
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  layout jsonb not null default '{"tabs":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.programs enable row level security;

create policy "anyone reads programs" on public.programs
  for select using (true);
create policy "admins write programs" on public.programs
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Guides (instructions for a button)
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  button_id text not null,
  label text not null,
  description text not null default '',
  modules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (program_id, button_id)
);
alter table public.guides enable row level security;

create policy "anyone reads guides" on public.guides
  for select using (true);
create policy "admins write guides" on public.guides
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger programs_touch before update on public.programs
  for each row execute function public.touch_updated_at();
create trigger guides_touch before update on public.guides
  for each row execute function public.touch_updated_at();

-- Storage bucket for custom button icons
insert into storage.buckets (id, name, public)
values ('button-icons', 'button-icons', true);

create policy "public read icons" on storage.objects
  for select using (bucket_id = 'button-icons');
create policy "admins upload icons" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'button-icons' and public.has_role(auth.uid(), 'admin'));
create policy "admins update icons" on storage.objects
  for update to authenticated
  using (bucket_id = 'button-icons' and public.has_role(auth.uid(), 'admin'));
create policy "admins delete icons" on storage.objects
  for delete to authenticated
  using (bucket_id = 'button-icons' and public.has_role(auth.uid(), 'admin'));

-- Seed Inventor program with empty layout (will be populated from existing data file on first admin save)
insert into public.programs (slug, name, layout) values
  ('inventor', 'Autodesk Inventor', '{"tabs":[]}'::jsonb);
