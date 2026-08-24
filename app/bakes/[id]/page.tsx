import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cloneBake } from "@/app/clone-actions";
import HelpButton from "@/app/HelpButton";
import ProcessForm from "./ProcessForm";
import EvaluationForm from "./EvaluationForm";
import PhotosSection from "./PhotosSection";
import FormulaEditor from "./FormulaEditor";
import ExperimentNameEditor from "./ExperimentNameEditor";

type Ingredient = { ingredient_type: string; name: string; grams: number; sort_order: number };
type ProcessStep = { step_type: string; description: string | null; note: string | null; duration_minutes: number | null; temperature_f: number | null; sort_order: number };
type BakingStage = { temperature_f: number | null; duration_minutes: number | null; lid_on: boolean | null; description: string | null; sort_order: number };
type Evaluation = { crumb_openness: string | null; crumb_evenness: number | null; moisture: string | null; chew: string | null; oven_spring: number | null; structure_rating: number | null; height_rise: number | null; top_crust_color: number | null; bottom_crust_color: number | null; crispness: number | null; flavor: number | null; overall_rating: number | null; would_bake_again: string | null; notes: string | null; criterion_notes: Record<string, string> | null };
type PhotoRow = { id: string; storage_path: string; caption: string | null; created_at: string; taken_at: string | null; is_thumbnail: boolean };

export default async function BakePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ editFormula?: string }> }) {
  const { id } = await params;
  const { editFormula } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bake } = await supabase
    .from("bakes")
    .select("id, name, experiment_name, bake_date, ingredients(ingredient_type, name, grams, sort_order), process_steps(step_type, description, note, duration_minutes, temperature_f, sort_order), baking_stages(temperature_f, duration_minutes, lid_on, description, sort_order), evaluations(crumb_openness, crumb_evenness, moisture, chew, oven_spring, structure_rating, height_rise, top_crust_color, bottom_crust_color, crispness, flavor, overall_rating, would_bake_again, notes, criterion_notes)")
    .eq("id", id)
    .single();
  if (!bake) notFound();

  const { data: photoRows } = await supabase
    .from("bake_photos")
    .select("id, storage_path, caption, created_at, taken_at, is_thumbnail")
    .eq("bake_id", id);

  const sortedPhotoRows = ((photoRows ?? []) as PhotoRow[]).sort((a, b) => {
    const aTime = new Date(a.taken_at ?? a.created_at).getTime();
    const bTime = new Date(b.taken_at ?? b.created_at).getTime();
    return bTime - aTime;
  });

  const photos = await Promise.all(
    sortedPhotoRows.map(async (photo) => {
      const { data } = await supabase.storage.from("bake-photos").createSignedUrl(photo.storage_path, 60 * 60);
      return { ...photo, signed_url: data?.signedUrl ?? "" };
    })
  );

  const ingredients = ((bake.ingredients ?? []) as Ingredient[]).sort((a, b) => a.sort_order - b.sort_order);
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
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="inline-block text-sm font-medium text-stone-500">← Bakes</Link>
        <HelpButton />
      </div>
      <header className="mb-7">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bake</p>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{bake.name}</h1>
            <ExperimentNameEditor bakeId={id} initialValue={bake.experiment_name ?? null} />
            <p className="mt-2 text-sm text-stone-500">{new Date(`${bake.bake_date}T12:00:00`).toLocaleDateString()}</p>
          </div>
          <div className="rounded-xl bg-stone-100 px-3 py-2 text-right"><div className="text-lg font-semibold">{hydration.toFixed(1)}%</div><div className="text-xs text-stone-500">hydration</div></div>
        </div>
      </header>

      <FormulaEditor bakeId={id} initialIngredients={ingredients} defaultOpen={editFormula === "1"} />
      <ProcessForm bakeId={id} initialSteps={steps} initialBaking={baking} initialCooling={cooling} />
      <EvaluationForm bakeId={id} initial={evaluation} />
      <PhotosSection bakeId={id} userId={user.id} initialPhotos={photos.filter((photo) => photo.signed_url)} />

      <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Bake this again</h2>
        <p className="mt-1 text-sm leading-6 text-stone-500">Copies the formula and workflow into a new bake dated today. Evaluation, photos, and experiment name stay with this bake.</p>
        <form action={cloneBake.bind(null, id)} className="mt-4">
          <button type="submit" className="min-h-12 w-full rounded-xl bg-stone-900 px-4 font-semibold text-white">Clone This</button>
        </form>
      </section>
    </main>
  );
}
