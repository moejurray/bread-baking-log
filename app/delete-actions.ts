"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deleteBake(bakeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bake } = await supabase
    .from("bakes")
    .select("id")
    .eq("id", bakeId)
    .single();

  if (!bake) redirect("/");

  const { data: photoRows } = await supabase
    .from("bake_photos")
    .select("storage_path")
    .eq("bake_id", bakeId);

  const storagePaths = (photoRows ?? []).map((row) => row.storage_path).filter(Boolean);
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("bake-photos")
      .remove(storagePaths);

    if (storageError) {
      redirect(`/?error=${encodeURIComponent(`Could not delete bake photos: ${storageError.message}`)}`);
    }
  }

  const { error: deleteError } = await supabase
    .from("bakes")
    .delete()
    .eq("id", bakeId);

  if (deleteError) {
    redirect(`/?error=${encodeURIComponent(deleteError.message)}`);
  }

  redirect("/");
}
