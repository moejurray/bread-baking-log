create table if not exists public.bake_photos (
  id uuid primary key default gen_random_uuid(),
  bake_id uuid not null references public.bakes(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  storage_path text not null unique,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.bake_photos enable row level security;

drop policy if exists "Users can view own bake photos" on public.bake_photos;
create policy "Users can view own bake photos"
  on public.bake_photos for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert own bake photos" on public.bake_photos;
create policy "Users can insert own bake photos"
  on public.bake_photos for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own bake photos" on public.bake_photos;
create policy "Users can update own bake photos"
  on public.bake_photos for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own bake photos" on public.bake_photos;
create policy "Users can delete own bake photos"
  on public.bake_photos for delete
  to authenticated
  using (user_id = auth.uid());
