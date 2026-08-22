"use client";

import { useState, type DragEvent, type WheelEvent } from "react";
import { saveProcess } from "./actions";

type ProcessStep = { step_type: string; description: string | null; duration_minutes: number | null; temperature_f: number | null };
type BakingStage = { temperature_f: number | null; duration_minutes: number | null; lid_on: boolean | null; description: string | null };

const defaultSteps: ProcessStep[] = [
  { step_type: "mixing", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "kneading", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "proofing", description: "First proof", duration_minutes: null, temperature_f: null },
  { step_type: "shaping", description: "", duration_minutes: null, temperature_f: null },
  { step_type: "proofing", description: "Final proof", duration_minutes: null, temperature_f: null },
];

const defaultBaking: BakingStage[] = [
  { temperature_f: 450, duration_minutes: null, lid_on: true, description: "" },
  { temperature_f: 450, duration_minutes: null, lid_on: false, description: "" },
];

const coolingNames = ["Cooling in Dutch oven", "Cooling on rack"];

function preventWheelChange(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

export default function ProcessForm({ bakeId, initialSteps, initialBaking }: { bakeId: string; initialSteps: ProcessStep[]; initialBaking: BakingStage[] }) {
  const existingCooling = initialSteps.filter((step) => coolingNames.includes(step.description ?? ""));
  const initialProcess = initialSteps.filter((step) => !coolingNames.includes(step.description ?? ""));
  const [steps, setSteps] = useState(initialProcess.length ? initialProcess : defaultSteps);
  const [baking, setBaking] = useState(initialBaking.length ? initialBaking : defaultBaking);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const action = saveProcess.bind(null, bakeId);

  const cooling = coolingNames.map((name) => existingCooling.find((step) => step.description === name) ?? { step_type: "resting", description: name, duration_minutes: null, temperature_f: null });

  function addStep() {
    setSteps((current) => [...current, { step_type: "other", description: "", duration_minutes: null, temperature_f: null }]);
  }

  function moveStep(from: number, to: number) {
    if (to < 0 || to >= steps.length || from === to) return;
    setSteps((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function dropStep(event: DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault();
    if (draggedIndex !== null) moveStep(draggedIndex, targetIndex);
    setDraggedIndex(null);
  }

  function addBakingStage() {
    setBaking((current) => [...current, { temperature_f: 450, duration_minutes: null, lid_on: false, description: "" }]);
  }

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-stone-900">Process</h2><p className="mt-1 text-sm text-stone-500">Drag steps or use the arrows to put them in order.</p></div>
          <button type="button" onClick={addStep} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700">+ Step</button>
        </div>
        <div className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <div key={index} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropStep(event, index)} className="rounded-2xl bg-stone-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="cursor-grab select-none text-sm font-semibold text-stone-500" title="Drag to reorder">☰ Step {index + 1}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => moveStep(index, index - 1)} disabled={index === 0} aria-label="Move step up" className="min-h-9 min-w-10 rounded-lg border border-stone-300 bg-white px-2 text-stone-700 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveStep(index, index + 1)} disabled={index === steps.length - 1} aria-label="Move step down" className="min-h-9 min-w-10 rounded-lg border border-stone-300 bg-white px-2 text-stone-700 disabled:opacity-30">↓</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-stone-700">Step
                  <select name="step_type" defaultValue={step.step_type} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="mixing">Mixing</option><option value="kneading">Kneading</option><option value="proofing">Proofing</option><option value="shaping">Shaping</option><option value="resting">Resting</option><option value="other">Other</option></select>
                </label>
                <label className="text-sm font-medium text-stone-700">Minutes<input name="step_duration" type="number" min="0" defaultValue={step.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label>
              </div>
              <label className="mt-3 block text-sm font-medium text-stone-700">What did you do?<input name="step_description" defaultValue={step.description ?? ""} placeholder="e.g. Stand mixer, speed 2" className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label>
              <label className="mt-3 block text-sm font-medium text-stone-700">Temperature °F <span className="font-normal text-stone-400">(when useful)</span><input name="step_temperature" type="number" step="0.1" defaultValue={step.temperature_f ?? ""} placeholder="76" onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label>
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-4 min-h-12 w-full rounded-xl border border-dashed border-stone-400 bg-stone-50 px-4 py-3 font-semibold text-stone-700">+ Add another process step</button>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-stone-900">Baking</h2><p className="mt-1 text-sm text-stone-500">Use separate stages for lid on/off or temperature changes.</p></div><button type="button" onClick={addBakingStage} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700">+ Stage</button></div>
        <div className="mt-4 space-y-4">
          {baking.map((stage, index) => (
            <div key={index} className="rounded-2xl bg-stone-50 p-4">
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-stone-700">Oven °F<input name="bake_temperature" type="number" step="0.1" defaultValue={stage.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label><label className="text-sm font-medium text-stone-700">Minutes<input name="bake_duration" type="number" min="0" defaultValue={stage.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label></div>
              <div className="mt-3 grid grid-cols-[9rem_1fr] gap-3"><label className="text-sm font-medium text-stone-700">Lid<select name="bake_lid" defaultValue={stage.lid_on ? "on" : "off"} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base"><option value="on">On</option><option value="off">Off</option></select></label><label className="text-sm font-medium text-stone-700">Note<input name="bake_description" defaultValue={stage.description ?? ""} placeholder="Optional" className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label></div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div><h2 className="text-lg font-semibold text-stone-900">Cooling</h2><p className="mt-1 text-sm text-stone-500">Record cooling after the loaf leaves the oven.</p></div>
        <div className="mt-4 space-y-4">
          {cooling.map((step) => (
            <div key={step.description} className="rounded-2xl bg-stone-50 p-4">
              <input type="hidden" name="cooling_name" value={step.description ?? ""} />
              <h3 className="font-semibold text-stone-800">{step.description}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-medium text-stone-700">Minutes<input name="cooling_duration" type="number" min="0" defaultValue={step.duration_minutes ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label><label className="text-sm font-medium text-stone-700">Temperature °F <span className="font-normal text-stone-400">(optional)</span><input name="cooling_temperature" type="number" step="0.1" defaultValue={step.temperature_f ?? ""} onWheel={preventWheelChange} className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base" /></label></div>
            </div>
          ))}
        </div>
      </section>

      <button type="submit" className="min-h-12 w-full rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white">Save Process</button>
    </form>
  );
}
