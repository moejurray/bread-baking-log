"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function todayPacific() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function cloneBake(sourceBakeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: source, error: sourceError } = await supabase
    .from("bakes")
    .select("id, name, ingredients(ingredient_type, name, grams, sort_order), process_steps(step_type, description, duration_minutes, temperature_f, sort_order), baking_stages(temperature_f, duration_minutes, lid_on, description, sort_order)")
    .eq("id", sourceBakeId)
    .single();

  if (sourceError || !source) {
    redirect(`/?error=${encodeURIComponent(sourceError?.message ?? "Could not find bake to clone")}`);
  }

  const { data: newBake, error: bakeError } = await supabase
    .from("bakes")
    .insert({
      user_id: user.id,
      name: source.name,
      bake_date: todayPacific(),
    })
    .select("id")
    .single();

  if (bakeError || !newBake) {
    redirect(`/?error=${encodeURIComponent(bakeError?.message ?? "Could not clone bake")}`);
  }

  const ingredients = (source.ingredients ?? []).map((item) => ({
    bake_id: newBake.id,
    ingredient_type: item.ingredient_type,
    name: item.name,
    grams: item.grams,
    sort_order: item.sort_order,
  }));

  const processSteps = (source.process_steps ?? []).map((step) => ({
    bake_id: newBake.id,
    step_type: step.step_type,
    description: step.description,
    duration_minutes: step.duration_minutes,
    temperature_f: step.temperature_f,
    sort_order: step.sort_order,
  }));

  const bakingStages = (source.baking_stages ?? []).map((stage) => ({
    bake_id: newBake.id,
    temperature_f: stage.temperature_f,
    duration_minutes: stage.duration_minutes,
    lid_on: stage.lid_on,
    description: stage.description,
    sort_order: stage.sort_order,
  }));

  if (ingredients.length) {
    const { error } = await supabase.from("ingredients").insert(ingredients);
    if (error) {
      await supabase.from("bakes").delete().eq("id", newBake.id);
      redirect(`/?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (processSteps.length) {
    const { error } = await supabase.from("process_steps").insert(processSteps);
    if (error) {
      await supabase.from("bakes").delete().eq("id", newBake.id);
      redirect(`/?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (bakingStages.length) {
    const { error } = await supabase.from("baking_stages").insert(bakingStages);
    if (error) {
      await supabase.from("bakes").delete().eq("id", newBake.id);
      redirect(`/?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect(`/bakes/${newBake.id}`);
}
