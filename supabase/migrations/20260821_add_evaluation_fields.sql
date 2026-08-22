-- Expand the evaluations table for the Bread Baking Log MVP.
-- Existing fields are preserved.

alter table public.evaluations
  add column if not exists crumb_openness text,
  add column if not exists moisture text,
  add column if not exists chew text,
  add column if not exists oven_spring integer,
  add column if not exists structure_rating integer,
  add column if not exists crust_thickness text,
  add column if not exists crispness integer,
  add column if not exists flavor integer,
  add column if not exists would_bake_again text,
  add column if not exists evaluated_at timestamptz default now();

alter table public.evaluations
  drop constraint if exists evaluations_oven_spring_check,
  add constraint evaluations_oven_spring_check
    check (oven_spring is null or oven_spring between 1 and 5),
  drop constraint if exists evaluations_structure_rating_check,
  add constraint evaluations_structure_rating_check
    check (structure_rating is null or structure_rating between 1 and 5),
  drop constraint if exists evaluations_crispness_check,
  add constraint evaluations_crispness_check
    check (crispness is null or crispness between 1 and 5),
  drop constraint if exists evaluations_flavor_check,
  add constraint evaluations_flavor_check
    check (flavor is null or flavor between 1 and 5),
  drop constraint if exists evaluations_crumb_openness_check,
  add constraint evaluations_crumb_openness_check
    check (crumb_openness is null or crumb_openness in ('Tight','Medium','Open','Very open','Irregular')),
  drop constraint if exists evaluations_moisture_check,
  add constraint evaluations_moisture_check
    check (moisture is null or moisture in ('Too dry','Slightly dry','Ideal','Slightly wet','Too wet')),
  drop constraint if exists evaluations_chew_check,
  add constraint evaluations_chew_check
    check (chew is null or chew in ('Too tender','Tender','Ideal','Chewy','Too tough')),
  drop constraint if exists evaluations_crust_thickness_check,
  add constraint evaluations_crust_thickness_check
    check (crust_thickness is null or crust_thickness in ('Thin','Medium','Thick')),
  drop constraint if exists evaluations_would_bake_again_check,
  add constraint evaluations_would_bake_again_check
    check (would_bake_again is null or would_bake_again in ('Yes','No','Unsure'));
