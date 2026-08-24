alter table public.bake_photos
add column if not exists is_thumbnail boolean not null default false;

create unique index if not exists bake_photos_one_thumbnail_per_bake
on public.bake_photos (bake_id)
where is_thumbnail = true;
