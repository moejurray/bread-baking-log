"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveBakeName(bakeId: string, bakeName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const name = bakeName.trim();
  if (!name) return { ok: false, error: "Title cannot be blank." };

  const { error } = await supabase
    .from("bakes")
    .update({ name })
    .eq("id", bakeId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function saveExperimentName(bakeId: string, experimentName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { error } = await supabase
    .from("bakes")
    .update({ experiment_name: experimentName.trim() || null })
    .eq("id", bakeId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
