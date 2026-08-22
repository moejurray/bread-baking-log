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

function Rating({ name, label, value }: { name: string; label: string; value: number | null }) {
  return <label className="text-sm font-medium text-stone-700">{label}<select name={name} defaultValue={value ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option>{ratingOptions.map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>;
}

export default function EvaluationForm({ bakeId, initial }: { bakeId: string; initial: Evaluation | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function queueSave() {
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!formRef.current) return;
      setStatus("saving");
      const result = await saveEvaluation(bakeId, new FormData(formRef.current));
      if (result.ok) { setStatus("saved"); setError(""); }
      else { setStatus("error"); setError(result.error ?? "Could not save evaluation."); }
    }, 900);
  }

  return (
    <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-stone-900">Evaluation</h2><p className="mt-1 text-sm text-stone-500">How did this loaf actually turn out?</p></div><div className="pt-1 text-xs text-stone-400" aria-live="polite">{status === "pending" ? "Changes pending…" : status === "saving" ? "Saving…" : status === "saved" ? "✓ Saved" : status === "error" ? "Save failed" : ""}</div></div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form ref={formRef} onChange={queueSave} onInput={queueSave} className="mt-5 space-y-6">
        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Crumb</h3><div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-stone-700">Openness<select name="crumb_openness" defaultValue={initial?.crumb_openness ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Tight</option><option>Medium</option><option>Open</option><option>Very open</option><option>Irregular</option></select></label>
          <Rating name="crumb_evenness" label="Evenness 1–5" value={initial?.crumb_evenness ?? null} />
          <label className="text-sm font-medium text-stone-700">Moisture<select name="moisture" defaultValue={initial?.moisture ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Too dry</option><option>Slightly dry</option><option>Ideal</option><option>Slightly wet</option><option>Too wet</option></select></label>
          <label className="text-sm font-medium text-stone-700">Chew<select name="chew" defaultValue={initial?.chew ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Too tender</option><option>Tender</option><option>Ideal</option><option>Chewy</option><option>Too tough</option></select></label>
        </div></div>

        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Rise & structure</h3><div className="grid grid-cols-2 gap-3"><Rating name="oven_spring" label="Oven spring 1–5" value={initial?.oven_spring ?? null} /><Rating name="structure_rating" label="Structure 1–5" value={initial?.structure_rating ?? null} /></div></div>

        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Crust</h3><div className="grid grid-cols-2 gap-3"><Rating name="top_crust_color" label="Top color 1–5" value={initial?.top_crust_color ?? null} /><Rating name="bottom_crust_color" label="Bottom color 1–5" value={initial?.bottom_crust_color ?? null} /><label className="text-sm font-medium text-stone-700">Thickness<select name="crust_thickness" defaultValue={initial?.crust_thickness ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Thin</option><option>Medium</option><option>Thick</option></select></label><Rating name="crispness" label="Crispness 1–5" value={initial?.crispness ?? null} /></div></div>

        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Overall</h3><div className="grid grid-cols-2 gap-3"><Rating name="flavor" label="Flavor 1–5" value={initial?.flavor ?? null} /><Rating name="overall_rating" label="Overall 1–5" value={initial?.overall_rating ?? null} /><label className="col-span-2 text-sm font-medium text-stone-700">Would you bake this again?<select name="would_bake_again" defaultValue={initial?.would_bake_again ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Yes</option><option>No</option><option>Unsure</option></select></label></div></div>

        <label className="block text-sm font-medium text-stone-700">Notes<textarea name="evaluation_notes" defaultValue={initial?.notes ?? ""} placeholder="What worked? What would you change next time?" rows={4} className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base" /></label>
      </form>
    </section>
  );
}
