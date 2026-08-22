"use client";

import { useEffect, useRef, useState } from "react";
import { saveEvaluation } from "./evaluation-actions";

type Evaluation = {
  crumb_openness: string | null;
  crumb_evenness: number | null;
  moisture: string | null;
  chew: string | null;
  oven_spring: number | null;
  structure_rating: number | null;
  top_crust_color: number | null;
  bottom_crust_color: number | null;
  crust_thickness: string | null;
  crispness: number | null;
  flavor: number | null;
  overall_rating: number | null;
  would_bake_again: string | null;
  notes: string | null;
};

const ratingOptions = [1, 2, 3, 4, 5];

function Help({ text }: { text: string }) {
  return (
    <details className="relative inline-block align-middle">
      <summary className="ml-1 inline-flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border border-stone-300 bg-white text-[11px] font-bold text-stone-500">?</summary>
      <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-3 text-xs font-normal leading-5 text-stone-600 shadow-lg">
        {text}
      </div>
    </details>
  );
}

function Rating({ name, label, value, help }: { name: string; label: string; value: number | null; help: string }) {
  return (
    <label className="text-sm font-medium text-stone-700">
      <span>{label}<Help text={`${help} 1 is least desirable; 5 is best.`} /></span>
      <select name={name} defaultValue={value ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base">
        <option value="">—</option>
        {ratingOptions.map((rating) => <option key={rating} value={rating}>{rating}</option>)}
      </select>
    </label>
  );
}

export default function EvaluationForm({ bakeId, initial }: { bakeId: string; initial: Evaluation | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function saveNow() {
    if (!formRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("saving");
    window.dispatchEvent(new CustomEvent("bread-workflow-section", { detail: "evaluation" }));
    const result = await saveEvaluation(bakeId, new FormData(formRef.current));
    if (result.ok) { setStatus("saved"); setError(""); }
    else { setStatus("error"); setError(result.error ?? "Could not save evaluation."); }
  }

  function queueSave() {
    setStatus("pending");
    window.dispatchEvent(new CustomEvent("bread-workflow-section", { detail: "evaluation" }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveNow, 900);
  }

  return (
    <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="sticky top-3 z-20 flex justify-end pointer-events-none">
        <div className={`rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-sm ${status === "error" ? "border-red-200 text-red-700" : "border-stone-200 text-stone-600"}`} aria-live="polite">
          {status === "pending" ? "Changes pending…" : status === "saving" ? "Saving…" : status === "saved" ? "✓ Saved" : status === "error" ? "Save failed" : ""}
        </div>
      </div>

      <div className="-mt-7 pr-20">
        <h2 className="text-lg font-semibold text-stone-900">Evaluation</h2>
        <p className="mt-1 text-sm text-stone-500">How did this loaf actually turn out?</p>
      </div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form ref={formRef} onChange={queueSave} onInput={queueSave} className="mt-5 space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Crumb</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-stone-700">Openness<Help text="How open the crumb is overall, from a tight sandwich-bread crumb to large, airy holes." />
              <select name="crumb_openness" defaultValue={initial?.crumb_openness ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Tight</option><option>Medium</option><option>Open</option><option>Very open</option><option>Irregular</option></select>
            </label>
            <Rating name="crumb_evenness" label="Evenness" value={initial?.crumb_evenness ?? null} help="How evenly the holes are distributed through the crumb." />
            <label className="text-sm font-medium text-stone-700">Moisture<Help text="Judge the interior after the loaf has cooled: dry, pleasantly moist, or gummy/wet." />
              <select name="moisture" defaultValue={initial?.moisture ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Too dry</option><option>Slightly dry</option><option>Ideal</option><option>Slightly wet</option><option>Too wet</option></select>
            </label>
            <label className="text-sm font-medium text-stone-700">Chew<Help text="The bite and resistance of the crumb: tender through pleasantly chewy to tough." />
              <select name="chew" defaultValue={initial?.chew ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Too tender</option><option>Tender</option><option>Ideal</option><option>Chewy</option><option>Too tough</option></select>
            </label>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Rise & structure</h3>
          <div className="grid grid-cols-2 gap-3">
            <Rating name="oven_spring" label="Oven spring" value={initial?.oven_spring ?? null} help="How strongly the loaf expanded after it went into the oven." />
            <Rating name="structure_rating" label="Structure" value={initial?.structure_rating ?? null} help="How well the loaf held its intended shape instead of spreading, collapsing, or becoming dense." />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Crust</h3>
          <div className="grid grid-cols-2 gap-3">
            <Rating name="top_crust_color" label="Top color" value={initial?.top_crust_color ?? null} help="How close the top crust color is to your preferred bake." />
            <Rating name="bottom_crust_color" label="Bottom color" value={initial?.bottom_crust_color ?? null} help="How close the bottom crust color is to your preferred bake. We are adding a separate note field for comments such as 'a little too dark.'" />
            <label className="text-sm font-medium text-stone-700">Thickness <span className="font-normal text-stone-400">(changing to Height / Rise)</span>
              <select name="crust_thickness" defaultValue={initial?.crust_thickness ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Thin</option><option>Medium</option><option>Thick</option></select>
            </label>
            <Rating name="crispness" label="Crispness" value={initial?.crispness ?? null} help="How crisp and crackly the crust is compared with your ideal." />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Overall</h3>
          <div className="grid grid-cols-2 gap-3">
            <Rating name="flavor" label="Flavor" value={initial?.flavor ?? null} help="Overall flavor quality and balance." />
            <Rating name="overall_rating" label="Overall" value={initial?.overall_rating ?? null} help="Your overall judgment of this bake." />
            <label className="col-span-2 text-sm font-medium text-stone-700">Would you bake this again?
              <select name="would_bake_again" defaultValue={initial?.would_bake_again ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Yes</option><option>No</option><option>Unsure</option></select>
            </label>
          </div>
        </div>

        <label className="block text-sm font-medium text-stone-700">Notes
          <textarea name="evaluation_notes" defaultValue={initial?.notes ?? ""} onBlur={saveNow} placeholder="What worked? What would you change next time?" rows={4} className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base" />
          <span className="mt-1 block text-xs font-normal text-stone-400">Autosaves while you type and again when you leave the field.</span>
        </label>
      </form>
    </section>
  );
}
