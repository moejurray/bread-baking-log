import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import { cloneBake } from "./clone-actions";
import { deleteBake } from "./delete-actions";
import DeleteBakeButton from "./DeleteBakeButton";

type Ingredient = { ingredient_type: string; name: string; grams: number };
type Bake = { id: string; name: string; bake_date: string; ingredients: Ingredient[] };

function bakeMath(ingredients: Ingredient[]) {
  const flours = ingredients.filter((item) => item.ingredient_type === "flour");
  const totalFlour = flours.reduce((sum, item) => sum + Number(item.grams), 0);
  const water = ingredients.filter((item) => item.ingredient_type === "water").reduce((sum, item) => sum + Number(item.grams), 0);
  const hydration = totalFlour > 0 ? (water / totalFlour) * 100 : 0;
  return { flours, totalFlour, hydration };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;

  const { data } = await supabase
    .from("bakes")
    .select("id, name, bake_date, ingredients(ingredient_type, name, grams)")
    .order("bake_date", { ascending: false });

  const bakes = (data ?? []) as Bake[];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-8 sm:max-w-2xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Bread Baking Log</p><h1 className="text-4xl font-semibold tracking-tight text-stone-900">Bakes</h1></div>
        <form action={signOut}><button type="submit" className="min-h-10 rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700">Sign out</button></form>
      </header>

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {bakes.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center shadow-sm">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-2xl text-white" aria-hidden="true">+</div><h2 className="text-xl font-semibold text-stone-900">No bakes yet</h2><p className="mt-2 max-w-sm leading-6 text-stone-600">Record your first formula and start building your baking history.</p><Link href="/new" className="mt-7 min-h-12 rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white">New Bake</Link>
        </section>
      ) : (
        <section className="space-y-4">
          {bakes.map((bake) => {
            const math = bakeMath(bake.ingredients);
            return (
              <article key={bake.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300">
                <Link href={`/bakes/${bake.id}`} className="block">
                  <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-stone-900">{bake.name}</h2><p className="mt-1 text-sm text-stone-500">{new Date(`${bake.bake_date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p></div><div className="rounded-xl bg-stone-100 px-3 py-2 text-right"><div className="text-lg font-semibold text-stone-900">{math.hydration.toFixed(1)}%</div><div className="text-xs text-stone-500">hydration</div></div></div>
                  <p className="mt-4 text-sm leading-6 text-stone-600">{math.flours.map((flour) => `${flour.name} ${Number(flour.grams)}g`).join(" + ")}</p><p className="mt-1 text-xs text-stone-400">{math.totalFlour}g total flour · Open bake →</p>
                </Link>
                <div className="mt-4 flex gap-3 border-t border-stone-100 pt-4">
                  <form action={cloneBake.bind(null, bake.id)} className="flex-[2]">
                    <button type="submit" className="min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 text-sm font-semibold text-stone-700">Clone This</button>
                  </form>
                  <DeleteBakeButton action={deleteBake.bind(null, bake.id)} bakeName={bake.name} />
                </div>
              </article>
            );
          })}
        </section>
      )}

      <nav className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur" aria-label="Primary navigation"><div className="mx-auto grid max-w-md grid-cols-3 gap-2 text-center text-sm font-medium sm:max-w-2xl"><Link href="/" className="rounded-xl bg-stone-100 px-3 py-2 text-stone-900">Bakes</Link><Link href="/new" className="rounded-xl px-3 py-2 text-stone-700">New Bake</Link><span className="px-3 py-2 text-stone-400">Compare</span></div></nav>
    </main>
  );
}
