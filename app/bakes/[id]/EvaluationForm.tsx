"use client";

import { useEffect, useRef, useState } from "react";
import { saveEvaluation } from "./evaluation-actions";

type Evaluation = {
  crumb_openness: string | null; crumb_evenness: number | null; moisture: string | null; chew: string | null;
  oven_spring: number | null; structure_rating: number | null; top_crust_color: number | null; bottom_crust_color: number | null;
  crust_thickness: string | null; crispness: number | null; flavor: number | null; overall_rating: number | null;
  would_bake_again: string | null; notes: string | null; criterion_notes: Record<string, string> | null;
};

const ratingOptions = [1, 2, 3, 4, 5];
const criterionLabels: Record<string, string> = {
  crumb_openness: "Crumb openness", crumb_evenness: "Crumb evenness", moisture: "Moisture", chew: "Chew",
  oven_spring: "Oven spring", structure_rating: "Structure", top_crust_color: "Top color", bottom_crust_color: "Bottom color",
  crust_thickness: "Thickness", crispness: "Crispness", flavor: "Flavor", overall_rating: "Overall", would_bake_again: "Bake again",
};

function Help({ text }: { text: string }) {
  return <details className="relative inline-block align-middle"><summary className="ml-1 inline-flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border border-stone-300 bg-white text-[11px] font-bold text-stone-500">?</summary><div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-3 text-xs font-normal leading-5 text-stone-600 shadow-lg">{text}</div></details>;
}

function NotePopover({ criterion, initialValue, onChanged }: { criterion: string; initialValue: string; onChanged: (criterion: string, value: string) => void }) {
  const [value, setValue] = useState(initialValue);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleOutsidePointer(event: PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, []);

  return (
    <details ref={detailsRef} className="relative inline-block align-middle">
      <summary title="Add note" className={`ml-1 inline-flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border text-[11px] ${value ? "border-stone-700 bg-stone-800 text-white" : "border-stone-300 bg-white text-stone-500"}`}>✎</summary>
      <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
        <div className="mb-2 text-xs font-semibold text-stone-700">Note about {criterionLabels[criterion]}</div>
        <textarea name={`criterion_note_${criterion}`} value={value} onChange={(event) => { setValue(event.target.value); onChanged(criterion, event.target.value); }} placeholder="Add a quick observation…" rows={3} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-normal text-stone-800" />
        <div className="mt-1 text-[11px] font-normal text-stone-400">Autosaves. Click anywhere outside this note to close it.</div>
      </div>
    </details>
  );
}

function LabelTools({ criterion, help, note, onNoteChanged }: { criterion: string; help: string; note: string; onNoteChanged: (criterion: string, value: string) => void }) {
  return <><Help text={help} /><NotePopover criterion={criterion} initialValue={note} onChanged={onNoteChanged} /></>;
}

function Rating({ name, label, value, help, note, onNoteChanged }: { name: string; label: string; value: number | null; help: string; note: string; onNoteChanged: (criterion: string, value: string) => void }) {
  return <label className="text-sm font-medium text-stone-700"><span>{label}<LabelTools criterion={name} help={`${help} 1 is least desirable; 5 is best.`} note={note} onNoteChanged={onNoteChanged} /></span><select name={name} defaultValue={value ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option>{ratingOptions.map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>;
}

export default function EvaluationForm({ bakeId, initial }: { bakeId: string; initial: Evaluation | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [criterionNotes, setCriterionNotes] = useState<Record<string, string>>(initial?.criterion_notes ?? {});

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function saveNow() {
    if (!formRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("saving");
    const result = await saveEvaluation(bakeId, new FormData(formRef.current));
    if (result.ok) { setStatus("saved"); setError(""); } else { setStatus("error"); setError(result.error ?? "Could not save evaluation."); }
  }
  function queueSave() { setStatus("pending"); if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(saveNow, 900); }
  function changeNote(criterion: string, value: string) { setCriterionNotes((current) => ({ ...current, [criterion]: value })); queueSave(); }
  const note = (key: string) => criterionNotes[key] ?? "";
  const savedNotes = Object.entries(criterionNotes).filter(([, value]) => value.trim());

  return (
    <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="sticky top-3 z-20 flex justify-end pointer-events-none"><div className={`rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-sm ${status === "error" ? "border-red-200 text-red-700" : "border-stone-200 text-stone-600"}`} aria-live="polite">{status === "pending" ? "Changes pending…" : status === "saving" ? "Saving…" : status === "saved" ? "✓ Saved" : status === "error" ? "Save failed" : ""}</div></div>
      <div className="-mt-7 pr-20"><h2 className="text-lg font-semibold text-stone-900">Evaluation</h2><p className="mt-1 text-sm text-stone-500">How did this loaf actually turn out?</p></div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form ref={formRef} onChange={queueSave} onInput={queueSave} className="mt-5 space-y-6">
        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Crumb</h3><div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-stone-700">Openness<LabelTools criterion="crumb_openness" help="How open the crumb is overall, from a tight sandwich-bread crumb to large, airy holes." note={note("crumb_openness")} onNoteChanged={changeNote} /><select name="crumb_openness" defaultValue={initial?.crumb_openness ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Tight</option><option>Medium</option><option>Open</option><option>Very open</option><option>Irregular</option></select></label>
          <Rating name="crumb_evenness" label="Evenness" value={initial?.crumb_evenness ?? null} help="How evenly the holes are distributed through the crumb." note={note("crumb_evenness")} onNoteChanged={changeNote} />
          <label className="text-sm font-medium text-stone-700">Moisture<LabelTools criterion="moisture" help="Judge the interior after the loaf has cooled: dry, pleasantly moist, or gummy/wet." note={note("moisture")} onNoteChanged={changeNote} /><select name="moisture" defaultValue={initial?.moisture ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Too dry</option><option>Slightly dry</option><option>Ideal</option><option>Slightly wet</option><option>Too wet</option></select></label>
          <label className="text-sm font-medium text-stone-700">Chew<LabelTools criterion="chew" help="The bite and resistance of the crumb: tender through pleasantly chewy to tough." note={note("chew")} onNoteChanged={changeNote} /><select name="chew" defaultValue={initial?.chew ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Too tender</option><option>Tender</option><option>Ideal</option><option>Chewy</option><option>Too tough</option></select></label>
        </div></div>

        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Rise & structure</h3><div className="grid grid-cols-2 gap-3"><Rating name="oven_spring" label="Oven spring" value={initial?.oven_spring ?? null} help="How strongly the loaf expanded after it went into the oven." note={note("oven_spring")} onNoteChanged={changeNote} /><Rating name="structure_rating" label="Structure" value={initial?.structure_rating ?? null} help="How well the loaf held its intended shape instead of spreading, collapsing, or becoming dense." note={note("structure_rating")} onNoteChanged={changeNote} /></div></div>

        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Crust</h3><div className="grid grid-cols-2 gap-3">
          <Rating name="top_crust_color" label="Top color" value={initial?.top_crust_color ?? null} help="How close the top crust color is to your preferred bake." note={note("top_crust_color")} onNoteChanged={changeNote} />
          <Rating name="bottom_crust_color" label="Bottom color" value={initial?.bottom_crust_color ?? null} help="How close the bottom crust color is to your preferred bake." note={note("bottom_crust_color")} onNoteChanged={changeNote} />
          <label className="text-sm font-medium text-stone-700">Thickness <span className="font-normal text-stone-400">(changing to Height / Rise)</span><LabelTools criterion="crust_thickness" help="Temporary field; this will become Height / Rise." note={note("crust_thickness")} onNoteChanged={changeNote} /><select name="crust_thickness" defaultValue={initial?.crust_thickness ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Thin</option><option>Medium</option><option>Thick</option></select></label>
          <Rating name="crispness" label="Crispness" value={initial?.crispness ?? null} help="How crisp and crackly the crust is compared with your ideal." note={note("crispness")} onNoteChanged={changeNote} />
        </div></div>

        <div><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Overall</h3><div className="grid grid-cols-2 gap-3"><Rating name="flavor" label="Flavor" value={initial?.flavor ?? null} help="Overall flavor quality and balance." note={note("flavor")} onNoteChanged={changeNote} /><Rating name="overall_rating" label="Overall" value={initial?.overall_rating ?? null} help="Your overall judgment of this bake." note={note("overall_rating")} onNoteChanged={changeNote} /><label className="col-span-2 text-sm font-medium text-stone-700">Would you bake this again?<LabelTools criterion="would_bake_again" help="Your simple gut check after evaluating the loaf." note={note("would_bake_again")} onNoteChanged={changeNote} /><select name="would_bake_again" defaultValue={initial?.would_bake_again ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="">—</option><option>Yes</option><option>No</option><option>Unsure</option></select></label></div></div>

        {savedNotes.length > 0 ? <div className="rounded-2xl bg-stone-50 p-4"><h3 className="text-sm font-semibold text-stone-800">Criterion notes</h3><div className="mt-3 space-y-2">{savedNotes.map(([key, value]) => <div key={key} className="text-sm"><span className="font-medium text-stone-700">{criterionLabels[key] ?? key}:</span> <span className="text-stone-600">{value}</span></div>)}</div></div> : null}

        <label className="block text-sm font-medium text-stone-700">General notes<textarea name="evaluation_notes" defaultValue={initial?.notes ?? ""} onBlur={saveNow} placeholder="Anything about the bake that doesn't belong to one specific criterion…" rows={4} className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base" /><span className="mt-1 block text-xs font-normal text-stone-400">Criterion notes appear above; use this for broader observations.</span></label>
      </form>
    </section>
  );
}
