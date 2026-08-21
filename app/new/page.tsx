import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BakeForm from "./BakeForm";

export default async function NewBakePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pt-8 sm:max-w-2xl">
      <header className="mb-8">
        <Link href="/" className="mb-5 inline-block text-sm font-medium text-stone-500">← Bakes</Link>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bread Baking Log</p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">New Bake</h1>
        <p className="mt-3 leading-6 text-stone-600">Start with the formula. Process and evaluation come next.</p>
      </header>
      <BakeForm error={error} />
    </main>
  );
}
