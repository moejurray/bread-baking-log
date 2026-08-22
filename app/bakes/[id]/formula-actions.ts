"use server";

import { createClient } from "@/lib/supabase/server";

function numberOrZero(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function saveFormula(bakeId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data: bake } = await supabase.from("bakes").select("id").eq("id", bakeId).single();
  if (!bake) return { ok: false, error: "Bake not found." };

  const flourNames = formData.getAll("flour_name").map(String);
  const flourCustomNames = formData.getAll("flour_custom").map(String);
  const flourGrams = formData.getAll("flour_grams");
  const ingredients: Array<{ bake_id: string; ingredient_type: string; name: string; grams: number; sort_order: number }> = [];

  flourNames.forEach((flourName, index) => {
    const custom = flourCustomNames[index]?.trim();
    const name = flourName === "Other" ? custom : flourName;
    const grams = numberOrZero(flourGrams[index] ?? null);
    if (name && grams > 0) ingredients.push({ bake_id: bakeId, ingredient_type: "flour", name, grams, sort_order: index });
  });

  if (!ingredients.some((item) => item.ingredient_type === "flour")) return { ok: false, error: "Keep at least one flour with a weight." };

  const water = numberOrZero(formData.get("water_grams"));
  const salt = numberOrZero(formData.get("salt_grams"));
  const yeast = numberOrZero(formData.get("yeast_grams"));
  const yeastType = String(formData.get("yeast_type") ?? "Instant yeast").trim() || "Instant yeast";

  if (water > 0) ingredients.push({ bake_id: bakeId, ingredient_type: "water", name: "Water", grams: water, sort_order: 100 });
  if (salt > 0) ingredients.push({ bake_id: bakeId, ingredient_type: "salt", name: "Salt", grams: salt, sort_order: 110 });
  if (yeast > 0) ingredients.push({ bake_id: bakeId, ingredient_type: "yeast", name: yeastType, grams: yeast, sort_order: 120 });

  const { error: deleteError } = await supabase.from("ingredients").delete().eq("bake_id", bakeId);
  if (deleteError) return { ok: false, error: deleteError.message };

  const { error: insertError } = await supabase.from("ingredients").insert(ingredients);
  if (insertError) return { ok: false, error: insertError.message };

  return { ok: true, error: null };
}
