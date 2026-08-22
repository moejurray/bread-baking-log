-- Replace the temporary crust thickness concept with a true loaf height/rise rating.

alter table public.evaluations
  add column if not exists height_rise integer;

alter table public.evaluations
  drop constraint if exists evaluations_height_rise_check,
  add constraint evaluations_height_rise_check
    check (height_rise is null or height_rise between 1 and 5);
