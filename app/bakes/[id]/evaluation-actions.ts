"use server";

import { createClient } from "@/lib/supabase/server";

const criterionKeys = [
  "crumb_openness",
  "crumb_evenness",
  "moisture",
  "chew",
  "oven_spring",
  "structure_rating",
  "height_rise",
  "top_crust_color",
  "bottom_crust_color",
  "crispness",
  "flavor",
  "overall_rating",
  "would_bake_again",
];

function integerOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isInteger(parsed) ? parsed : null;
}

function textOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function saveEvaluation(bakeId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data: bake } = await supabase.from("bakes").select("id").eq("id", bakeId).single();
  if (!bake) return { ok: false, error: "Bake not found." };

  const criterionNotes = Object.fromEntries(
    criterionKeys
      .map((key) => [key, String(formData.get(`criterion_note_${key}`) ?? "").trim()] as const)
      .filter(([, value]) => value.length > 0)
  );

  const payload = {
    bake_id: bakeId,
    crumb_openness: textOrNull(formData.get("crumb_openness")),
    crumb_evenness: integerOrNull(formData.get("crumb_evenness")),
    moisture: textOrNull(formData.get("moisture")),
    chew: textOrNull(formData.get("chew")),
    oven_spring: integerOrNull(formData.get("oven_spring")),
    structure_rating: integerOrNull(formData.get("structure_rating")),
    height_rise: integerOrNull(formData.get("height_rise")),
    top_crust_color: integerOrNull(formData.get("top_crust_color")),
    bottom_crust_color: integerOrNull(formData.get("bottom_crust_color")),
    crispness: integerOrNull(formData.get("crispness")),
    flavor: integerOrNull(formData.get("flavor")),
    overall_rating: integerOrNull(formData.get("overall_rating")),
    would_bake_again: textOrNull(formData.get("would_bake_again")),
    notes: textOrNull(formData.get("evaluation_notes")),
    criterion_notes: criterionNotes,
    evaluated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("evaluations")
    .upsert(payload, { onConflict: "bake_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
