alter table public.bake_photos
add column if not exists taken_at timestamptz;
