import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProcessForm from "./ProcessForm";
import EvaluationForm from "./EvaluationForm";
import PhotosSection from "./PhotosSection";

type Ingredient = { ingredient_type: string; name: string; grams: number };
type ProcessStep = { step_type: string; description: string | null; duration_minutes: number | null; temperature_f: number | null; sort_order: number };
type BakingStage = { temperature_f: number | null; duration_minutes: number | null; lid_on: boolean | null; description: string | null; sort_order: number };
type Evaluation = { crumb_openness: string | null; crumb_evenness: number | null; moisture: string | null; chew: string | null; oven_spring: number | null; structure_rating: number | null; height_rise: number | null; top_crust_color: number | null; bottom_crust_color: number | null; crispness: number | null; flavor: number | null; overall_rating: number | null; would_bake_again: string | null; notes: string | null; criterion_notes: Record<string, string> | null };
type PhotoRow = { id: string; storage_path: string; caption: string | null };

export default async function BakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bake } = await supabase
    .from("bakes")
    .select("id, name, bake_date, ingredients(ingredient_type, name, grams), process_steps(step_type, description, duration_minutes, temperature_f, sort_order), baking_stages(temperature_f, duration_minutes, lid_on, description, sort_order), evaluations(crumb_openness, crumb_evenness, moisture, chew, oven_spring, structure_rating, height_rise, top_crust_color, bottom_crust_color, crispness, flavor, overall_rating, would_bake_again, notes, criterion_notes)")
    .eq("id", id)
    .single();
  if (!bake) notFound();

  const { data: photoRows } = await supabase
    .from("bake_photos")
    .select("id, storage_path, caption")
    .eq("bake_id", id)
    .order("created_at", { ascending: false });

  const photos = await Promise.all(
    ((photoRows ?? []) as PhotoRow[]).map(async (photo) => {
      const { data } = await supabase.storage.from("bake-photos").createSignedUrl(photo.storage_path, 60 * 60);
      return { ...photo, signed_url: data?.signedUrl ?? "" };
    })
  );

  const ingredients = (bake.ingredients ?? []) as Ingredient[];
  const totalFlour = ingredients.filter((item) => item.ingredient_type === "flour").reduce((sum, item) => sum + Number(item.grams), 0);
  const water = ingredients.filter((item) => item.ingredient_type === "water").reduce((sum, item) => sum + Number(item.grams), 0);
  const hydration = totalFlour ? (water / totalFlour) * 100 : 0;
  const allSteps = ((bake.process_steps ?? []) as ProcessStep[]).sort((a, b) => a.sort_order - b.sort_order);
  const steps = allSteps.filter((step) => step.sort_order < 1000);
  const cooling = allSteps.filter((step) => step.sort_order >= 1000);
  const baking = ((bake.baking_stages ?? []) as BakingStage[]).sort((a, b) => a.sort_order - b.sort_order);
  const evaluation = Array.isArray(bake.evaluations) ? (bake.evaluations[0] as Evaluation | undefined) ?? null : (bake.evaluations as Evaluation | null);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-8 sm:max-w-2xl">
      <Link href="/" className="mb-5 inline-block text-sm font-medium text-stone-500">← Bakes</Link>
      <header className="mb-7"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bake</p><div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight text-stone-900">{bake.name}</h1><p className="mt-2 text-sm text-stone-500">{new Date(`${bake.bake_date}T12:00:00`).toLocaleDateString()}</p></div><div className="rounded-xl bg-stone-100 px-3 py-2 text-right"><div className="text-lg font-semibold">{hydration.toFixed(1)}%</div><div className="text-xs text-stone-500">hydration</div></div></div></header>

      <details className="mb-6 rounded-3xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Formula</h2><span className="text-sm text-stone-500">{totalFlour}g flour · {hydration.toFixed(1)}%</span></div></summary>
        <div className="border-t border-stone-100 px-5 pb-5 pt-4"><div className="space-y-2 text-sm">{ingredients.map((item, index) => <div key={index} className="flex justify-between gap-4"><span className="text-stone-600">{item.name}</span><span className="font-medium text-stone-900">{Number(item.grams)}g</span></div>)}</div></div>
      </details>

      <ProcessForm bakeId={id} initialSteps={steps} initialBaking={baking} initialCooling={cooling} />
      <EvaluationForm bakeId={id} initial={evaluation} />
      <PhotosSection bakeId={id} userId={user.id} initialPhotos={photos.filter((photo) => photo.signed_url)} />
    </main>
  );
}
