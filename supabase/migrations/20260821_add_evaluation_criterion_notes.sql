-- Store per-criterion evaluation notes without adding one column per criterion.

alter table public.evaluations
  add column if not exists criterion_notes jsonb not null default '{}'::jsonb;
