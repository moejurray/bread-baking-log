"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent, type WheelEvent } from "react";
import { saveProcess } from "./actions";

type ProcessStep = { step_type: string; description: string | null; duration_minutes: number | null; temperature_f: number | null };
type BakingStage = { temperature_f: number | null; duration_minutes: number | null; lid_on: boolean | null; description: string | null };
type SaveState = "saved" | "saving" | "unsaved" | "error";

const defaultSteps: ProcessStep[] = [
  { step_type: "mixing", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "kneading", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "proofing", description: "First proof", duration_minutes: null, temperature_f: null },
  { step_type: "shaping", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "proofing", description: "Final proof", duration_minutes: null, temperature_f: null },
];
const defaultBaking: BakingStage[] = [{ temperature_f: 450, duration_minutes: null, lid_on: true, description: "" }, { temperature_f: 450, duration_minutes: null, lid_on: false, description: "" }];
const coolingNames = ["Cooling in Dutch oven", "Cooling on rack"];

function preventWheelChange(event: WheelEvent<HTMLInputElement>) { event.currentTarget.blur(); }

export default function ProcessForm({ bakeId, initialSteps, initialBaking, initialCooling }: { bakeId: string; initialSteps: ProcessStep[]; initialBaking: BakingStage[]; initialCooling: ProcessStep[] }) {
  const [steps, setSteps] = useState(initialSteps.length ? initialSteps : defaultSteps);
  const [baking, setBaking] = useState(initialBaking.length ? initialBaking : defaultBaking);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const cooling = coolingNames.map((name) => initialCooling.find((step) => step.description === name) ?? { step_type: "resting", description: name, duration_minutes: null, temperature_f: null });

  async function saveNow() {
    if (!formRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState("saving"); setSaveError("");
    const result = await saveProcess(bakeId, new FormData(formRef.current));
    if (result.ok) setSaveState("saved"); else { setSaveState("error"); setSaveError(result.error ?? "Could not save."); }
  }

  function scheduleSave() {
    setSaveState("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveNow, 900);
  }

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, baking]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.name) scheduleSave();
  }
  function addStep() { setSteps((current) => [...current, { step_type: "other", description: "", duration_minutes: null, temperature_f: null }]); }
  function deleteStep(index: number) { setSteps((current) => current.filter((_, i) => i !== index)); }
  function moveStep(from: number, to: number) { if (to < 0 || to >= steps.length || from === to) return; setSteps((current) => { const next = [...current]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; }); }
  function dropStep(event: DragEvent<HTMLDivElement>, targetIndex: number) { event.preventDefault(); if (draggedIndex !== null) moveStep(draggedIndex, targetIndex); setDraggedIndex(null); }
  function addBakingStage() { setBaking((current) => [...current, { temperature_f: 450, duration_minutes: null, lid_on: false, description: "" }]); }
  function deleteBakingStage(index: number) { setBaking((current) => current.filter((_, i) => i !== index)); }

  return (
    <form ref={formRef} onChange={handleChange} className="space-y-6">
      <div className="sticky top-3 z-10 flex justify-end pointer-events-none"><div className={`rounded-full border bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-sm ${saveState === "error" ? "border-red-200 text-red-700" : "border-stone-200 text-stone-600"}`}>{saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Changes pending…" : saveState === "error" ? `Not saved: ${saveError}` : "✓ Saved"}</div></div>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-stone-900">Process</h2><p className="mt-1 text-sm text-stone-500">Drag steps or use the arrows to put them in order.</p></div><button type="button" onClick={addStep} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700">+ Step</button></div>
        <div className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <div key={index} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropStep(event, index)} className="rounded-2xl bg-stone-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><span className="cursor-grab select-none text-sm font-semibold text-stone-500">☰ Step {index + 1}</span><div className="flex gap-2"><button type="button" onClick={() => moveStep(index, index - 1)} disabled={index === 0} aria-label="Move step up" className="min-h-9 min-w-10 rounded-lg border border-stone-300 bg-white px-2 disabled:opacity-30">↑</button><button type="button" onClick={() => moveStep(index, index + 1)} disabled={index === steps.length - 1} aria-label="Move step down" className="min-h-9 min-w-10 rounded-lg border border-stone-300 bg-white px-2 disabled:opacity-30">↓</button><button type="button" onClick={() => deleteStep(index)} aria-label={`Delete step ${index + 1}`} title="Delete step" className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg leading-none text-stone-500 hover:border-red-300 hover:text-red-600">−</button></div></div>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-stone-700">Step<select name="step_type" defaultValue={step.step_type} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="mixing">Mixing</option><option value="kneading">Kneading</option><option value="proofing">Proofing</option><option value="shaping">Shaping</option><option value="resting">Resting</option><option value="other">Other</option></select></label><label className="text-sm font-medium text-stone-700">Minutes<input name="step_duration" type="number" min="0" defaultValue={step.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label></div>
              <label className="mt-3 block text-sm font-medium text-stone-700">What did you do?<input name="step_description" defaultValue={step.description ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label><label className="mt-3 block text-sm font-medium text-stone-700">Temperature °F <span className="font-normal text-stone-400">(when useful)</span><input name="step_temperature" type="number" step="0.1" defaultValue={step.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label>
            </div>
          ))}
        </div><button type="button" onClick={addStep} className="mt-4 min-h-12 w-full rounded-xl border border-dashed border-stone-400 bg-stone-50 px-4 py-3 font-semibold text-stone-700">+ Add another process step</button>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Baking</h2><p className="mt-1 text-sm text-stone-500">Use separate stages for lid on/off or temperature changes.</p></div><button type="button" onClick={addBakingStage} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm font-semibold">+ Stage</button></div><div className="mt-4 space-y-4">{baking.map((stage, index) => <div key={index} className="rounded-2xl bg-stone-50 p-4"><div className="mb-2 flex justify-end"><button type="button" onClick={() => deleteBakingStage(index)} aria-label={`Delete baking stage ${index + 1}`} title="Delete stage" className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-500 hover:border-red-300 hover:text-red-600">−</button></div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Oven °F<input name="bake_temperature" type="number" step="0.1" defaultValue={stage.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label><label className="text-sm font-medium">Minutes<input name="bake_duration" type="number" min="0" defaultValue={stage.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label></div><div className="mt-3 grid grid-cols-[9rem_1fr] gap-3"><label className="text-sm font-medium">Lid<select name="bake_lid" defaultValue={stage.lid_on ? "on" : "off"} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3"><option value="on">On</option><option value="off">Off</option></select></label><label className="text-sm font-medium">Note<input name="bake_description" defaultValue={stage.description ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label></div></div>)}</div></section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Cooling</h2><p className="mt-1 text-sm text-stone-500">Record cooling after the loaf leaves the oven.</p><div className="mt-4 space-y-4">{cooling.map((step) => <div key={step.description} className="rounded-2xl bg-stone-50 p-4"><input type="hidden" name="cooling_name" value={step.description ?? ""} /><h3 className="font-semibold">{step.description}</h3><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-medium">Minutes<input name="cooling_duration" type="number" min="0" defaultValue={step.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label><label className="text-sm font-medium">Temperature °F <span className="font-normal text-stone-400">(optional)</span><input name="cooling_temperature" type="number" step="0.1" defaultValue={step.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-3" /></label></div></div>)}</div></section>
    </form>
  );
}
