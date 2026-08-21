import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProcessForm from "./ProcessForm";

type Ingredient = { ingredient_type: string; name: string; grams: number };
type ProcessStep = { step_type: string; description: string | null; duration_minutes: number | null; temperature_f: number | null; sort_order: number };
type BakingStage = { temperature_f: number | null; duration_minutes: number | null; lid_on: boolean | null; description: string | null; sort_order: number };

export default async function BakePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params;
  const status = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bake } = await supabase
    .from("bakes")
    .select("id, name, bake_date, ingredients(ingredient_type, name, grams), process_steps(step_type, description, duration_minutes, temperature_f, sort_order), baking_stages(temperature_f, duration_minutes, lid_on, description, sort_order)")
    .eq("id", id)
    .single();
  if (!bake) notFound();

  const ingredients = (bake.ingredients ?? []) as Ingredient[];
  const totalFlour = ingredients.filter((item) => item.ingredient_type === "flour").reduce((sum, item) => sum + Number(item.grams), 0);
  const water = ingredients.filter((item) => item.ingredient_type === "water").reduce((sum, item) => sum + Number(item.grams), 0);
  const hydration = totalFlour ? (water / totalFlour) * 100 : 0;
  const steps = ((bake.process_steps ?? []) as ProcessStep[]).sort((a, b) => a.sort_order - b.sort_order);
  const baking = ((bake.baking_stages ?? []) as BakingStage[]).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-8 sm:max-w-2xl">
      <Link href="/" className="mb-5 inline-block text-sm font-medium text-stone-500">← Bakes</Link>
      <header className="mb-7">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bake</p>
        <div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight text-stone-900">{bake.name}</h1><p className="mt-2 text-sm text-stone-500">{new Date(`${bake.bake_date}T12:00:00`).toLocaleDateString()}</p></div><div className="rounded-xl bg-stone-100 px-3 py-2 text-right"><div className="text-lg font-semibold">{hydration.toFixed(1)}%</div><div className="text-xs text-stone-500">hydration</div></div></div>
      </header>

      {status.saved ? <p className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Process saved.</p> : null}
      {status.error ? <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{status.error}</p> : null}

      <section className="mb-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Formula</h2>
        <div className="mt-3 space-y-2 text-sm">
          {ingredients.map((item, index) => <div key={index} className="flex justify-between gap-4"><span className="text-stone-600">{item.name}</span><span className="font-medium text-stone-900">{Number(item.grams)}g</span></div>)}
        </div>
      </section>

      <ProcessForm bakeId={id} initialSteps={steps} initialBaking={baking} />
    </main>
  );
}
