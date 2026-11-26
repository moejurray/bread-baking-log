-- Per-ingredient notes plus the amount/unit the baker actually entered.
-- `grams` stays the canonical weight used for hydration and summaries.

alter table public.ingredients
  add column if not exists note text,
  add column if not exists amount numeric,
  add column if not exists unit text;

-- Allow the new "other" ingredient type (milk, butter, eggs, ...).
alter table public.ingredients
  drop constraint if exists ingredients_ingredient_type_check;
