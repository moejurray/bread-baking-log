"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveProcess(bakeId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bake } = await supabase.from("bakes").select("id").eq("id", bakeId).single();
  if (!bake) redirect("/");

  const stepTypes = formData.getAll("step_type").map(String);
  const descriptions = formData.getAll("step_description").map(String);
  const durations = formData.getAll("step_duration");
  const temperatures = formData.getAll("step_temperature");

  const processSteps = stepTypes
    .map((stepType, index) => ({
      bake_id: bakeId,
      step_type: stepType,
      description: descriptions[index]?.trim() || null,
      duration_minutes: numberOrNull(durations[index] ?? null),
      temperature_f: numberOrNull(temperatures[index] ?? null),
      sort_order: index,
    }))
    .filter((step) => step.description || step.duration_minutes !== null || step.temperature_f !== null);

  const coolingNames = formData.getAll("cooling_name").map(String);
  const coolingDurations = formData.getAll("cooling_duration");
  const coolingTemperatures = formData.getAll("cooling_temperature");

  coolingNames.forEach((name, index) => {
    processSteps.push({
      bake_id: bakeId,
      step_type: "resting",
      description: name,
      duration_minutes: numberOrNull(coolingDurations[index] ?? null),
      temperature_f: numberOrNull(coolingTemperatures[index] ?? null),
      sort_order: 1000 + index,
    });
  });

  const bakeTemps = formData.getAll("bake_temperature");
  const bakeDurations = formData.getAll("bake_duration");
  const bakeDescriptions = formData.getAll("bake_description").map(String);
  const bakeLids = formData.getAll("bake_lid").map(String);

  const bakingStages = bakeDurations
    .map((duration, index) => ({
      bake_id: bakeId,
      temperature_f: numberOrNull(bakeTemps[index] ?? null),
      duration_minutes: numberOrNull(duration),
      lid_on: bakeLids[index] === "on",
      description: bakeDescriptions[index]?.trim() || null,
      sort_order: index,
    }))
    .filter((stage) => stage.duration_minutes !== null || stage.temperature_f !== null || stage.description);

  await supabase.from("process_steps").delete().eq("bake_id", bakeId);
  await supabase.from("baking_stages").delete().eq("bake_id", bakeId);

  if (processSteps.length > 0) {
    const { error } = await supabase.from("process_steps").insert(processSteps);
    if (error) redirect(`/bakes/${bakeId}?error=${encodeURIComponent(error.message)}`);
  }

  if (bakingStages.length > 0) {
    const { error } = await supabase.from("baking_stages").insert(bakingStages);
    if (error) redirect(`/bakes/${bakeId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/bakes/${bakeId}?saved=1`);
}
