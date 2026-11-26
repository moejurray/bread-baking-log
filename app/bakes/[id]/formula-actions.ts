"use server";

import { createClient } from "@/lib/supabase/server";
import { roundGrams, toGrams, unitsByKind } from "./units";

const sortBase: Record<string, number> = { flour: 0, water: 100, salt: 110, yeast: 120, other: 200 };

type IngredientInsert = { bake_id: string; ingredient_type: string; name: string; grams: number; sort_order: number; amount: number; unit: string; note: string | null };

export async function saveFormula(bakeId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data: bake } = await supabase.from("bakes").select("id").eq("id", bakeId).single();
  if (!bake) return { ok: false, error: "Bake not found." };

  const types = formData.getAll("ing_type").map(String);
  const names = formData.getAll("ing_name").map(String);
  const amounts = formData.getAll("ing_amount").map(String);
  const units = formData.getAll("ing_unit").map(String);
  const notes = formData.getAll("ing_note").map(String);
  const counters: Record<string, number> = {};
  const ingredients: IngredientInsert[] = [];

  types.forEach((type, index) => {
    if (!(type in sortBase)) return;
    const name = (names[index] ?? "").trim();
    const amount = Number((amounts[index] ?? "").trim());
    const unit = unitsByKind[type].includes(units[index] as never) ? units[index] : "g";
    const grams = roundGrams(toGrams(amount, unit, name));
    if (!name || !(grams > 0)) return;
    const position = counters[type] ?? 0; counters[type] = position + 1;
    ingredients.push({ bake_id: bakeId, ingredient_type: type, name, grams, sort_order: sortBase[type] + position, amount, unit, note: (notes[index] ?? "").trim() || null });
  });

  if (!ingredients.some((item) => item.ingredient_type === "flour")) return { ok: false, error: "Keep at least one flour with a weight." };

  const { error: deleteError } = await supabase.from("ingredients").delete().eq("bake_id", bakeId);
  if (deleteError) return { ok: false, error: deleteError.message };

  const { error: insertError } = await supabase.from("ingredients").insert(ingredients);
  if (insertError) {
    // If the units/notes migration has not been applied yet, still keep the weights.
    const legacy = ingredients.map((item) => ({ bake_id: item.bake_id, ingredient_type: item.ingredient_type, name: item.name, grams: item.grams, sort_order: item.sort_order }));
    const { error: legacyError } = await supabase.from("ingredients").insert(legacy);
    if (!legacyError) return { ok: false, error: "Weights saved, but notes and units need the latest database migration." };
    // Last resort: keep the core formula even if "other" ingredients are rejected.
    const { error: coreError } = await supabase.from("ingredients").insert(legacy.filter((item) => item.ingredient_type !== "other"));
    if (coreError) return { ok: false, error: insertError.message };
    return { ok: false, error: "Core formula saved, but other ingredients, notes and units need the latest database migration." };
  }

  return { ok: true, error: null };
}
