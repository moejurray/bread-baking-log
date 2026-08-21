"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function numberValue(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function createBake(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const bakeDate = String(formData.get("bake_date") ?? "").trim();

  if (!name) {
    redirect("/new?error=Please%20name%20this%20bake");
  }

  const { data: bake, error: bakeError } = await supabase
    .from("bakes")
    .insert({
      user_id: user.id,
      name,
      bake_date: bakeDate || undefined,
    })
    .select("id")
    .single();

  if (bakeError || !bake) {
    redirect(`/new?error=${encodeURIComponent(bakeError?.message ?? "Could not create bake")}`);
  }

  const flourNames = formData.getAll("flour_name").map(String);
  const flourCustomNames = formData.getAll("flour_custom").map(String);
  const flourGrams = formData.getAll("flour_grams").map(numberValue);

  const ingredients = flourNames
    .map((flourName, index) => {
      const custom = flourCustomNames[index]?.trim();
      const nameSnapshot = flourName === "Other" ? custom : flourName;
      const grams = flourGrams[index] ?? 0;

      if (!nameSnapshot || grams <= 0) return null;

      return {
        bake_id: bake.id,
        ingredient_type: "flour",
        name: nameSnapshot,
        grams,
        sort_order: index,
      };
    })
    .filter(Boolean) as Array<{
      bake_id: string;
      ingredient_type: string;
      name: string;
      grams: number;
      sort_order: number;
    }>;

  const waterGrams = numberValue(formData.get("water_grams"));
  const saltGrams = numberValue(formData.get("salt_grams"));
  const yeastGrams = numberValue(formData.get("yeast_grams"));
  const yeastType = String(formData.get("yeast_type") ?? "Instant yeast");

  if (waterGrams > 0) {
    ingredients.push({
      bake_id: bake.id,
      ingredient_type: "water",
      name: "Water",
      grams: waterGrams,
      sort_order: 100,
    });
  }

  if (saltGrams > 0) {
    ingredients.push({
      bake_id: bake.id,
      ingredient_type: "salt",
      name: "Salt",
      grams: saltGrams,
      sort_order: 110,
    });
  }

  if (yeastGrams > 0) {
    ingredients.push({
      bake_id: bake.id,
      ingredient_type: "yeast",
      name: yeastType,
      grams: yeastGrams,
      sort_order: 120,
    });
  }

  if (!ingredients.some((ingredient) => ingredient.ingredient_type === "flour")) {
    await supabase.from("bakes").delete().eq("id", bake.id);
    redirect("/new?error=Add%20at%20least%20one%20flour%20with%20a%20weight");
  }

  const { error: ingredientError } = await supabase.from("ingredients").insert(ingredients);

  if (ingredientError) {
    await supabase.from("bakes").delete().eq("id", bake.id);
    redirect(`/new?error=${encodeURIComponent(ingredientError.message)}`);
  }

  redirect("/");
}
