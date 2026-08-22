"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 6) {
    redirect("/update-password?error=Password%20must%20be%20at%20least%206%20characters");
  }

  if (password !== confirmPassword) {
    redirect("/update-password?error=Passwords%20do%20not%20match");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Password%20updated.%20You%20can%20sign%20in%20now.");
}
